import { ORPCError } from "@orpc/server";
import { createDb, schema } from "@workerSmtp/db";
import { env } from "@workerSmtp/env/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Context } from "../context";
import { o } from "../index";

async function encryptPassword(password: string): Promise<string> {
	const ALGORITHM = "AES-GCM";
	const IV_LENGTH = 12;
	const keyMaterial = new TextEncoder().encode(
		env.BETTER_AUTH_SECRET.padEnd(32, "x").slice(0, 32),
	);
	const key = await crypto.subtle.importKey("raw", keyMaterial, ALGORITHM, false, [
		"encrypt",
	]);
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
	const encoded = new TextEncoder().encode(password);
	const encrypted = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, encoded);
	const combined = new Uint8Array(iv.length + encrypted.byteLength);
	combined.set(iv);
	combined.set(new Uint8Array(encrypted), iv.length);
	return btoa(String.fromCharCode(...combined));
}

const requireSession = o.middleware(async ({ context, next }) => {
	if (!context.session?.user) throw new ORPCError("UNAUTHORIZED");
	return next({ context: { user: context.session.user } });
});

const createInput = z.object({
	label: z.string().min(1),
	host: z.string().min(1),
	port: z.number().int().positive(),
	secure: z.boolean().default(false),
	startTls: z.boolean().default(true),
	username: z.string().min(1),
	password: z.string().min(1),
	authType: z.enum(["plain", "login", "cram-md5"]).default("plain"),
	maxSendsPerMinute: z.number().int().positive().default(60),
	isDefault: z.boolean().default(false),
});

export const smtpProfileRouter = {
	create: o
		.use(requireSession)
		.input(createInput)
		.handler(
			async ({
				input,
				context,
			}: {
				input: z.infer<typeof createInput>;
				context: Context & { user: { id: string } };
			}) => {
				const db = createDb();
				const id = crypto.randomUUID();
				const encryptedPassword = await encryptPassword(input.password);
				await db
					.insert(schema.smtpProfile)
					.values({
						id,
						label: input.label,
						host: input.host,
						port: input.port,
						secure: input.secure,
						startTls: input.startTls,
						username: input.username,
						encryptedPassword,
						authType: input.authType,
						maxSendsPerMinute: input.maxSendsPerMinute,
						isDefault: input.isDefault,
						createdBy: context.user.id,
					})
					.run();
				return { id };
			},
		),

	list: o.use(requireSession).handler(async () => {
		const db = createDb();
		const profiles = await db.select().from(schema.smtpProfile).all();
		return { profiles };
	}),

	get: o
		.use(requireSession)
		.input(z.object({ id: z.string().min(1) }))
		.handler(async ({ input }: { input: { id: string } }) => {
			const db = createDb();
			const profile = await db
				.select()
				.from(schema.smtpProfile)
				.where(eq(schema.smtpProfile.id, input.id))
				.get();
			if (!profile)
				throw new ORPCError("NOT_FOUND", { message: "SMTP profile not found" });
			return profile;
		}),

	update: o
		.use(requireSession)
		.input(
			z.object({
				id: z.string().min(1),
				label: z.string().min(1).optional(),
				host: z.string().min(1).optional(),
				port: z.number().int().positive().optional(),
				secure: z.boolean().optional(),
				startTls: z.boolean().optional(),
				username: z.string().min(1).optional(),
				password: z.string().min(1).optional(),
				authType: z.enum(["plain", "login", "cram-md5"]).optional(),
				maxSendsPerMinute: z.number().int().positive().optional(),
				isDefault: z.boolean().optional(),
			}),
		)
		.handler(
			async ({
				input,
			}: {
				input: {
					id: string;
					label?: string;
					host?: string;
					port?: number;
					secure?: boolean;
					startTls?: boolean;
					username?: string;
					password?: string;
					authType?: string;
					maxSendsPerMinute?: number;
					isDefault?: boolean;
				};
			}) => {
				const db = createDb();
				const existing = await db
					.select()
					.from(schema.smtpProfile)
					.where(eq(schema.smtpProfile.id, input.id))
					.get();
				if (!existing)
					throw new ORPCError("NOT_FOUND", { message: "SMTP profile not found" });
				const updates: Record<string, unknown> = {};
				if (input.label !== undefined) updates.label = input.label;
				if (input.host !== undefined) updates.host = input.host;
				if (input.port !== undefined) updates.port = input.port;
				if (input.secure !== undefined) updates.secure = input.secure;
				if (input.startTls !== undefined) updates.startTls = input.startTls;
				if (input.username !== undefined) updates.username = input.username;
				if (input.password !== undefined)
					updates.encryptedPassword = await encryptPassword(input.password);
				if (input.authType !== undefined) updates.authType = input.authType;
				if (input.maxSendsPerMinute !== undefined)
					updates.maxSendsPerMinute = input.maxSendsPerMinute;
				if (input.isDefault !== undefined) updates.isDefault = input.isDefault;
				await db
					.update(schema.smtpProfile)
					.set(updates)
					.where(eq(schema.smtpProfile.id, input.id))
					.run();
				return { id: input.id };
			},
		),

	delete: o
		.use(requireSession)
		.input(z.object({ id: z.string().min(1) }))
		.handler(async ({ input }: { input: { id: string } }) => {
			const db = createDb();
			await db
				.delete(schema.smtpProfile)
				.where(eq(schema.smtpProfile.id, input.id))
				.run();
			return { id: input.id };
		}),
};
