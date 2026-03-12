import { eq } from "drizzle-orm";

import { db, todos } from "@/features/todo/entities/todo";

export async function pendingUpdate(
	id: string,
	fields: Record<string, unknown>,
) {
	await db
		.update(todos)
		.set({
			...fields,
			updatedAt: new Date().toISOString(),
			syncStatus: "pending",
		})
		.where(eq(todos.id, id));
}
