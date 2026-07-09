import type { RouterClient } from "@orpc/server";

import { createDb, schema } from "@workerSmtp/db";
import { sql } from "drizzle-orm";

import { protectedProcedure, publicProcedure } from "../index";

import { apiKeyRouter } from "./api-key";
import { emailRouter } from "./email";
import { smtpProfileRouter } from "./smtp-profile";
import { templateRouter } from "./template";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	canSignUp: publicProcedure.handler(async () => {
		const db = createDb();
		const existing = await db
			.select({ count: sql<number>`count(*)` })
			.from(schema.user)
			.get();
		return (existing?.count ?? 0) === 0;
	}),
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),
	email: emailRouter,
	template: templateRouter,
	"smtp-profile": smtpProfileRouter,
	"api-key": apiKeyRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
