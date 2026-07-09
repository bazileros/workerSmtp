import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

export const smtpProfile = sqliteTable("smtp_profile", {
	id: text("id").primaryKey(),
	label: text("label").notNull(),
	host: text("host").notNull(),
	port: integer("port").notNull(),
	secure: integer("secure", { mode: "boolean" }).default(false).notNull(),
	startTls: integer("start_tls", { mode: "boolean" }).default(true).notNull(),
	username: text("username").notNull(),
	encryptedPassword: text("encrypted_password").notNull(),
	authType: text("auth_type", { enum: ["plain", "login", "cram-md5"] })
		.default("plain")
		.notNull(),
	maxSendsPerMinute: integer("max_sends_per_minute").default(60).notNull(),
	isDefault: integer("is_default", { mode: "boolean" })
		.default(false)
		.notNull(),
	createdBy: text("created_by").references(() => user.id),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => new Date())
		.notNull(),
});
