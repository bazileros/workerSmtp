import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createAuth } from "@workerSmtp/auth";
import { createContext } from "@workerSmtp/api/context";
import { appRouter } from "@workerSmtp/api/routers/index";
import { createDb, schema } from "@workerSmtp/db";
import { env } from "@workerSmtp/env/server";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { processQueueBatch } from "./queue";

const app = new Hono();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => createAuth().handler(c.req.raw));

app.get("/admin/process-queue", async (c) => {
	try {
		const db = createDb();
		const queued = await db
			.select()
			.from(schema.email)
			.where(eq(schema.email.status, "queued"))
			.all();
		if (queued.length === 0) return c.json({ message: "No queued emails" });
		const results: { id: string; status: string; error?: string }[] = [];
		for (const email of queued) {
			try {
				await processQueueBatch(
					{
						messages: [
							{
								id: email.id,
								body: { emailId: email.id, attempt: 1, priority: email.priority ?? "bulk" },
								ack: () => {},
								retry: () => {},
							},
						],
					},
					env.BETTER_AUTH_SECRET,
				);
				results.push({ id: email.id, status: "processed" });
			} catch (err) {
				results.push({
					id: email.id,
					status: "failed",
					error: err instanceof Error ? err.message : String(err),
				});
			}
		}
		return c.json({ processed: results.length, results });
	} catch (err) {
		return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
	}
});

export const apiHandler = new OpenAPIHandler(appRouter, {
	plugins: [
		new OpenAPIReferencePlugin({
			schemaConverters: [new ZodToJsonSchemaConverter()],
		}),
	],
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

export const rpcHandler = new RPCHandler(appRouter, {
	interceptors: [
		onError((error) => {
			console.error(error);
		}),
	],
});

app.use("/*", async (c, next) => {
	const context = await createContext({ context: c });
	const method = c.req.raw.method;
	let req = c.req.raw;
	if (method === "POST" || method === "PUT" || method === "PATCH") {
		const text = await c.req.raw.clone().text().catch(() => "");
		req = new Request(c.req.raw.url, {
			method,
			headers: c.req.raw.headers,
			body: text || "{}",
		});
	}
	const rpcResult = await rpcHandler.handle(req, {
		prefix: "/rpc",
		context,
	});
	if (rpcResult.matched)
		return c.newResponse(rpcResult.response.body, rpcResult.response);
	const apiResult = await apiHandler.handle(req, {
		prefix: "/api-reference",
		context,
	});
	if (apiResult.matched)
		return c.newResponse(apiResult.response.body, apiResult.response);
	await next();
});

app.post("/admin/test-profile", async (c) => {
	try {
		const auth = createAuth();
		const session = await auth.api.getSession({ headers: c.req.raw.headers });
		if (!session?.user) return c.json({ error: "Unauthorized" }, 401);
		const { profileId, to, priority } = await c.req.json();
		const emailPriority = priority === "bulk" ? "bulk" : "transactional";
		const recipients = Array.isArray(to) ? to : [to];
		if (!recipients.length) return c.json({ error: "to is required" }, 400);

		const db = createDb();
		const profile = profileId
			? await db.select().from(schema.smtpProfile).where(eq(schema.smtpProfile.id, profileId)).get()
			: await db.select().from(schema.smtpProfile).where(eq(schema.smtpProfile.isDefault, true)).get();
		if (!profile) return c.json({ error: profileId ? "Profile not found" : "No default profile configured" }, 404);

		const sender = profile.username;

		const results: { email: string; success: boolean; error?: string; status?: string }[] = [];

		for (const recipient of recipients) {
			const id = crypto.randomUUID();
			try {
				await db.insert(schema.email).values({
					id, smtpProfileId: profileId, to: recipient,
					from: sender, subject: "Test from Mail Dispatch",
					htmlBody: "<h1>Test email</h1><p>This is a test from your SMTP profile.</p>",
					textBody: "This is a test from your SMTP profile.",
					status: "queued", priority: emailPriority, maxAttempts: emailPriority === "transactional" ? 3 : 1,
					createdBy: session.user.id,
				}).run();

				await processQueueBatch(
					{ messages: [{ id, body: { emailId: id, attempt: 1, priority: emailPriority }, ack: () => {}, retry: () => {} }] },
					env.BETTER_AUTH_SECRET,
				);
				const updated = await db.select().from(schema.email).where(eq(schema.email.id, id)).get();
				results.push({
					email: recipient,
					success: updated?.status === "sent",
					status: updated?.status ?? "unknown",
					error: updated?.lastError ?? undefined,
				});
			} catch (err) {
				results.push({ email: recipient, success: false, error: err instanceof Error ? err.message : String(err) });
			}
		}

		return c.json(results);
	} catch (err) {
		return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
	}
});

app.get("/", (c) => c.text("OK"));

export async function queue(batch: any, env: any) {
	await processQueueBatch(batch, env.BETTER_AUTH_SECRET);
}

// Preserve queue export for Cloudflare Workers runtime (prevents tree-shaking)
(app as any).queue = queue;

export default app;
