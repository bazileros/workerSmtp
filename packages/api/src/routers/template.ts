import { ORPCError } from "@orpc/server";
import { createDb, schema } from "@workerSmtp/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Context } from "../context";
import { zSafeHtml } from "../html";
import { o } from "../index";

const requireSession = o.middleware(async ({ context, next }) => {
	if (!context.session?.user) throw new ORPCError("UNAUTHORIZED");
	return next({ context: { user: context.session.user } });
});

const createInput = z.object({
	name: z.string().min(1),
	subject: z.string().min(1),
	htmlBody: zSafeHtml().pipe(z.string().min(1)),
	textBody: z.string().optional(),
	variables: z.array(z.string()).optional(),
});

export const templateRouter = {
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
				await db
					.insert(schema.template)
					.values({
						id,
						name: input.name,
						subject: input.subject,
						htmlBody: input.htmlBody,
						textBody: input.textBody ?? null,
						variables: input.variables ?? null,
						createdBy: context.user.id,
					})
					.run();
				return { id };
			},
		),

	list: o.use(requireSession).handler(async () => {
		const db = createDb();
		const templates = await db.select().from(schema.template).all();
		return { templates };
	}),

	get: o
		.use(requireSession)
		.input(z.object({ id: z.string().min(1) }))
		.handler(async ({ input }: { input: { id: string } }) => {
			const db = createDb();
			const tmpl = await db
				.select()
				.from(schema.template)
				.where(eq(schema.template.id, input.id))
				.get();
			if (!tmpl)
				throw new ORPCError("NOT_FOUND", { message: "Template not found" });
			return tmpl;
		}),

	update: o
		.use(requireSession)
		.input(
			z.object({
				id: z.string().min(1),
				name: z.string().min(1).optional(),
				subject: z.string().min(1).optional(),
				htmlBody: zSafeHtml().pipe(z.string().min(1)).optional(),
				textBody: z.string().optional(),
				variables: z.array(z.string()).optional(),
			}),
		)
		.handler(
			async ({
				input,
			}: {
				input: {
					id: string;
					name?: string;
					subject?: string;
					htmlBody?: string;
					textBody?: string;
					variables?: string[];
				};
			}) => {
				const db = createDb();
				const existing = await db
					.select()
					.from(schema.template)
					.where(eq(schema.template.id, input.id))
					.get();
				if (!existing)
					throw new ORPCError("NOT_FOUND", { message: "Template not found" });
				await db
					.update(schema.template)
					.set({
						...(input.name !== undefined && { name: input.name }),
						...(input.subject !== undefined && { subject: input.subject }),
						...(input.htmlBody !== undefined && { htmlBody: input.htmlBody }),
						...(input.textBody !== undefined && { textBody: input.textBody }),
						...(input.variables !== undefined && {
							variables: input.variables,
						}),
					})
					.where(eq(schema.template.id, input.id))
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
				.delete(schema.template)
				.where(eq(schema.template.id, input.id))
				.run();
			return { id: input.id };
		}),
};
