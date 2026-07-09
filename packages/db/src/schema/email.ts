import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { smtpProfile } from "./smtp-profile";

export const email = sqliteTable(
	"email",
	{
		id: text("id").primaryKey(),
		apiKeyId: text("api_key_id"),
		smtpProfileId: text("smtp_profile_id")
			.notNull()
			.references(() => smtpProfile.id),
		to: text("to").notNull(),
		subject: text("subject").notNull(),
		htmlBody: text("html_body"),
		textBody: text("text_body"),
		from: text("from").notNull(),
		replyTo: text("reply_to"),
		cc: text("cc"),
		bcc: text("bcc"),
		headers: text("headers", { mode: "json" }),
		priority: text("priority", { enum: ["transactional", "bulk"] })
			.notNull()
			.default("bulk"),
		status: text("status", {
			enum: ["queued", "sending", "sent", "failed", "bounced"],
		})
			.notNull()
			.default("queued"),
		queueMessageId: text("queue_message_id"),
		attempts: integer("attempts").default(0).notNull(),
		maxAttempts: integer("max_attempts").default(3).notNull(),
		lastError: text("last_error"),
		scheduledAt: integer("scheduled_at", { mode: "timestamp_ms" }),
		sentAt: integer("sent_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("email_status_idx").on(table.status),
		index("email_created_idx").on(table.createdAt),
		index("email_api_key_idx").on(table.apiKeyId),
		index("email_smtp_profile_idx").on(table.smtpProfileId),
	],
);

export const emailRelations = relations(email, ({ one }) => ({
	smtpProfile: one(smtpProfile, {
		fields: [email.smtpProfileId],
		references: [smtpProfile.id],
	}),
}));
