import { apiKey } from "@better-auth/api-key";
import { createDb } from "@workerSmtp/db";
import { schema } from "@workerSmtp/db";
import { env } from "@workerSmtp/env/server";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sql } from "drizzle-orm";

export function createAuth() {
	const db = createDb();

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: "sqlite",

			schema: schema,
		}),
		trustedOrigins: [env.CORS_ORIGIN],
		emailAndPassword: {
			enabled: true,
		},
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		advanced: {
			defaultCookieAttributes: {
				sameSite: "none",
				secure: true,
				httpOnly: true,
			},
		},
		databaseHooks: {
			user: {
				create: {
					before: async () => {
						const existing = await db
							.select({ count: sql<number>`count(*)` })
							.from(schema.user)
							.get();
						if (existing && existing.count > 0) {
							throw new APIError("BAD_REQUEST", {
								message: "Sign-up is disabled — an Operator already exists",
							});
						}
					},
				},
			},
		},
		plugins: [apiKey()],
	});
}
