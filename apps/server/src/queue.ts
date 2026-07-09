import { createDb } from "@workerSmtp/db";
import { schema } from "@workerSmtp/db";
import { eq } from "drizzle-orm";

import { sendEmail } from "./mailer";

export type QueueMessage = {
	emailId: string;
	attempt: number;
	priority: "transactional" | "bulk";
};

export async function processQueueBatch(
	batch: {
		messages: {
			id: string;
			body: QueueMessage;
			ack: () => void;
			retry: (opts?: { delaySeconds?: number }) => void;
		}[];
	},
	encryptionSecret: string,
) {
	const db = createDb();

	for (const msg of batch.messages) {
		const { emailId, attempt } = msg.body;

		try {
			const email = await db
				.select()
				.from(schema.email)
				.where(eq(schema.email.id, emailId))
				.get();

			if (!email) {
				msg.ack();
				continue;
			}

			await db
				.update(schema.email)
				.set({ status: "sending" as const, attempts: attempt })
				.where(eq(schema.email.id, emailId))
				.run();

			await sendEmail(
				{
					smtpProfileId: (email as any).smtpProfileId,
					to: (email as any).to,
					subject: (email as any).subject,
					htmlBody: (email as any).htmlBody ?? undefined,
					textBody: (email as any).textBody ?? undefined,
					from: (email as any).from,
					replyTo: (email as any).replyTo ?? undefined,
					cc: (email as any).cc ?? undefined,
					bcc: (email as any).bcc ?? undefined,
					headers:
						((email as any).headers as Record<string, string>) ?? undefined,
				},
				encryptionSecret,
			);

			await db
				.update(schema.email)
				.set({ status: "sent", sentAt: new Date() })
				.where(eq(schema.email.id, emailId))
				.run();

			msg.ack();
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : String(err);

			const email = await db
				.select()
				.from(schema.email)
				.where(eq(schema.email.id, emailId))
				.get();

			const isTransactional = (email as any)?.priority === "transactional";
			const maxAttempts = (email as any)?.maxAttempts ?? 3;

			if (isTransactional && attempt < maxAttempts) {
				await db
					.update(schema.email)
					.set({
						status: "queued" as const,
						lastError: errorMessage,
						attempts: attempt,
					})
					.where(eq(schema.email.id, emailId))
					.run();

				msg.retry({ delaySeconds: 2 ** attempt * 10 });
			} else {
				await db
					.update(schema.email)
					.set({
						status: "failed" as const,
						lastError: errorMessage,
						attempts: attempt,
					})
					.where(eq(schema.email.id, emailId))
					.run();

				msg.retry({ delaySeconds: 60 });
			}
		}
	}
}
