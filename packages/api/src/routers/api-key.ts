import { createAuth } from "@workerSmtp/auth";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { o } from "../index";

const requireSession = o.middleware(async ({ context, next }) => {
	if (!context.session?.user) throw new ORPCError("UNAUTHORIZED");
	return next({ context: { user: context.session.user } });
});

export const apiKeyRouter = {
	list: o.use(requireSession).handler(async ({ context }) => {
		const auth = createAuth();
		const { apiKeys } = await auth.api.listApiKeys({
			headers: context.request.headers as Record<string, string>,
		});
		return { apiKeys };
	}),

	create: o
		.use(requireSession)
		.input(z.object({ name: z.string().min(1) }))
		.handler(async ({ input, context }) => {
			const auth = createAuth();
			const result = await auth.api.createApiKey({
				body: { name: input.name },
				headers: context.request.headers as Record<string, string>,
			});
			return {
				key: result.key,
				start: result.start ?? result.prefix ?? undefined,
			};
		}),

	revoke: o
		.use(requireSession)
		.input(z.object({ keyId: z.string().min(1) }))
		.handler(async ({ input, context }) => {
			const auth = createAuth();
			await auth.api.deleteApiKey({
				body: { keyId: input.keyId },
				headers: context.request.headers as Record<string, string>,
			});
			return { keyId: input.keyId };
		}),
};
