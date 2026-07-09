import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

export const template = sqliteTable("template", {
	id: text("id").primaryKey(),
	name: text("name").notNull().unique(),
	subject: text("subject").notNull(),
	htmlBody: text("html_body").notNull(),
	textBody: text("text_body"),
	variables: text("variables", { mode: "json" }),
	createdBy: text("created_by").references(() => user.id),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => new Date())
		.notNull(),
});
