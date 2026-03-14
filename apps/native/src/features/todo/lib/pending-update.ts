import { eq } from "drizzle-orm";

import { appDb, todos } from "@/features/todo/entities/todo";

type PendingTodoUpdate = Partial<{
	title: string;
	completed: boolean;
	deleted: boolean;
	attachmentUrl: string | null;
	attachmentLocalUri: string | null;
	attachmentStatus: "queued" | "uploading" | "uploaded" | "failed" | null;
}>;

export async function pendingUpdate(id: string, fields: PendingTodoUpdate) {
	await appDb
		.update(todos)
		.set({
			...fields,
			updatedAt: new Date().toISOString(),
			syncStatus: "pending",
		})
		.where(eq(todos.id, id));
}
