import { createDb } from "@workerSmtp/db";
import { schema } from "@workerSmtp/db";
import { eq } from "drizzle-orm";
import { WorkerMailer } from "worker-mailer";

import { decrypt } from "./crypto";

export type SendOptions = {
	smtpProfileId: string;
	to: string;
	subject: string;
	htmlBody?: string;
	textBody?: string;
	from: string;
	replyTo?: string;
	cc?: string;
	bcc?: string;
	headers?: Record<string, string>;
};

export async function sendEmail(
	options: SendOptions,
	encryptionSecret: string,
): Promise<void> {
	const db = createDb();

	const profile = await db
		.select()
		.from(schema.smtpProfile)
		.where(eq(schema.smtpProfile.id, options.smtpProfileId))
		.get();

	if (!profile) {
		throw new Error(`SMTP profile not found: ${options.smtpProfileId}`);
	}

	const password = await decrypt(profile.encryptedPassword, encryptionSecret);

	await WorkerMailer.send(
		{
			host: profile.host,
			port: profile.port,
			secure: profile.secure,
			startTls: profile.startTls,
			authType: profile.authType as "plain" | "login" | "cram-md5",
			credentials: {
				username: profile.username,
				password,
			},
		},
		{
			from: options.from,
			to: options.to,
			subject: options.subject,
			text: options.textBody,
			html: options.htmlBody,
			reply: options.replyTo,
			headers: options.headers,
		},
	);
}
