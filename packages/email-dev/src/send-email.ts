import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { emailLog } from "./schema";

export interface SendEmailParams {
	to: string;
	from: string;
	subject: string;
	html: string;
	text?: string;
}

export async function sendEmail<TSchema extends Record<string, unknown>>(
	db: NodePgDatabase<TSchema>,
	params: SendEmailParams,
): Promise<void> {
	await db.insert(emailLog).values(params);
}
