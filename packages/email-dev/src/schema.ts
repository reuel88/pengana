import { index, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const emailLog = pgTable(
	"email_log",
	{
		id: serial("id").primaryKey(),
		to: text("to").notNull(),
		from: text("from").notNull(),
		subject: text("subject").notNull(),
		html: text("html").notNull(),
		text: text("text"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [index("email_log_createdAt_idx").on(table.createdAt)],
);
