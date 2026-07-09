import { createAuth } from "@workerSmtp/auth";
import { createDb } from "@workerSmtp/db";
import { schema } from "@workerSmtp/db";
import { env } from "@workerSmtp/env/server";
import { ORPCError } from "@orpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Context } from "../context";
import { o } from "../index";
import { zSafeHtml } from "../html";

const requireApiKey = o.middleware(async ({ context, next }) => {
  const authHeader = context.request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Missing or invalid Authorization header",
    });
  }
  const token = authHeader.slice(7);
  const result = await createAuth().api.verifyApiKey({ body: { key: token } });
  if (!result.valid) {
    throw new ORPCError("UNAUTHORIZED", { message: "Invalid API key" });
  }
  return next({
    context: {
      apiKey: (result.key as { id: string; name: string | null }) ?? null,
    },
  });
});

const requireSession = o.middleware(async ({ context, next }) => {
  if (!context.session?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({ context: { user: context.session.user } });
});

function resolveTemplate(
  text: string,
  variables: Record<string, string>,
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, name) => variables[name] ?? `{{${name}}}`);
}

const sendInput = z
  .object({
    smtpProfileId: z.string().optional(),
    to: z.union([z.email(), z.array(z.email())]),
    subject: z.string().min(1).max(998).optional(),
    htmlBody: zSafeHtml().optional(),
    textBody: z.string().optional(),
    from: z.string().optional(),
    replyTo: z.email().optional(),
    cc: z.string().optional(),
    bcc: z.string().optional(),
    headers: z.record(z.string(), z.string()).optional(),
    priority: z.enum(["transactional", "bulk"]).default("bulk"),
    scheduledAt: z.number().optional(),
    templateId: z.string().optional(),
    variables: z.record(z.string(), z.string()).optional(),
  })
  .refine(
    (data) => !!(data.htmlBody || data.textBody || data.templateId),
    { message: "Either htmlBody, textBody, or templateId must be provided" },
  )
  .refine(
    (data) => !!data.subject || !!data.templateId,
    { message: "Subject is required when templateId is not provided" },
  );

export const emailRouter = {
  send: o
    .use(requireApiKey)
    .input(sendInput)
    .handler(
      async ({
        input,
        context,
      }: {
        input: z.infer<typeof sendInput>;
        context: Context & {
          apiKey: { id: string; name: string | null } | null;
        };
      }) => {
        const db = createDb();
        const profile = input.smtpProfileId
          ? await db.select().from(schema.smtpProfile).where(eq(schema.smtpProfile.id, input.smtpProfileId)).get()
          : await db.select().from(schema.smtpProfile).where(eq(schema.smtpProfile.isDefault, true)).get();
        if (!profile)
          throw new ORPCError("NOT_FOUND", {
            message: input.smtpProfileId ? "SMTP profile not found" : "No default SMTP profile configured",
          });
        const from = input.from || profile.username;
        const recipients = Array.isArray(input.to) ? input.to : [input.to];
        const vars = input.variables ?? {};

        let htmlBody = input.htmlBody ?? null;
        let textBody = input.textBody ?? null;
        let subject = input.subject;

        if (input.templateId) {
          const tmpl = await db.select().from(schema.template).where(eq(schema.template.id, input.templateId)).get();
          if (!tmpl) throw new ORPCError("NOT_FOUND", { message: "Template not found" });
          htmlBody = resolveTemplate(tmpl.htmlBody, vars);
          textBody = tmpl.textBody ? resolveTemplate(tmpl.textBody, vars) : null;
          if (!subject) subject = resolveTemplate(tmpl.subject, vars);
        }

        if (!subject) throw new ORPCError("BAD_REQUEST", { message: "Subject is required" });

        const ids: string[] = [];
        for (const recipient of recipients) {
          const id = crypto.randomUUID();
          ids.push(id);
          const maxAttempts = input.priority === "transactional" ? 3 : 1;
          await db.insert(schema.email).values({
            id, smtpProfileId: profile.id, to: recipient,
            subject, htmlBody, textBody,
            from, replyTo: input.replyTo ?? null, cc: input.cc ?? null, bcc: input.bcc ?? null,
            headers: input.headers ?? null, priority: input.priority, status: "queued",
            maxAttempts, scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
            apiKeyId: context.apiKey?.id ?? null,
          }).run();
          await env.MAIL_QUEUE.send({ emailId: id, attempt: 1, priority: input.priority as string });
        }
        return { ids };
      },
    ),

  getStatus: o
    .use(requireApiKey)
    .input(z.object({ id: z.string().min(1) }))
    .handler(async ({ input }: { input: { id: string } }) => {
      const db = createDb();
      const email = await db
        .select()
        .from(schema.email)
        .where(eq(schema.email.id, input.id))
        .get();
      if (!email)
        throw new ORPCError("NOT_FOUND", { message: "Email not found" });
      return {
        id: email.id,
        status: email.status,
        attempts: email.attempts,
        maxAttempts: email.maxAttempts,
        lastError: email.lastError,
        sentAt: email.sentAt,
        createdAt: email.createdAt,
      };
    }),

  get: o
    .use(requireSession)
    .input(z.object({ id: z.string().min(1) }))
    .handler(async ({ input }: { input: { id: string } }) => {
      const db = createDb();
      const email = await db
        .select()
        .from(schema.email)
        .where(eq(schema.email.id, input.id))
        .get();
      if (!email)
        throw new ORPCError("NOT_FOUND", { message: "Email not found" });
      return email;
    }),

  list: o
    .use(requireSession)
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        status: z
          .enum(["queued", "sending", "sent", "failed", "bounced"])
          .optional(),
        priority: z.enum(["transactional", "bulk"]).optional(),
      }),
    )
    .handler(
      async ({
        input,
      }: {
        input: {
          limit: number;
          offset: number;
          status?: string;
          priority?: string;
        };
      }) => {
        const db = createDb();
        const conditions: ReturnType<typeof eq>[] = [];
        if (input.status)
          conditions.push(eq(schema.email.status, input.status as any));
        if (input.priority)
          conditions.push(eq(schema.email.priority, input.priority as any));
        const emails = await db
          .select()
          .from(schema.email)
          .where(and(...conditions))
          .orderBy(desc(schema.email.createdAt))
          .limit(input.limit)
          .offset(input.offset)
          .all();
        const total = await db
          .select({ count: sql<number>`count(*)` })
          .from(schema.email)
          .where(and(...conditions))
          .get();
        return { emails, total: total?.count ?? 0 };
      },
    ),

  retry: o
    .use(requireSession)
    .input(z.object({ id: z.string().min(1) }))
    .handler(async ({ input }: { input: { id: string } }) => {
      const db = createDb();
      const email = await db
        .select()
        .from(schema.email)
        .where(eq(schema.email.id, input.id))
        .get();
      if (!email)
        throw new ORPCError("NOT_FOUND", { message: "Email not found" });
      if (email.status !== "failed")
        throw new ORPCError("CONFLICT", {
          message: "Only failed emails can be retried",
        });
      await db
        .update(schema.email)
        .set({ status: "queued", attempts: 0, lastError: null })
        .where(eq(schema.email.id, input.id))
        .run();
      await env.MAIL_QUEUE.send({
        emailId: email.id,
        attempt: 1,
        priority: email.priority ?? "bulk",
      });
      return { id: email.id, status: "queued" };
    }),
};
