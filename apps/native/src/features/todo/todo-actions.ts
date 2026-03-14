import { eq } from "drizzle-orm";
import { randomUUID } from "expo-crypto";

import { appDb, todos } from "@/features/todo/entities/todo";
import { pendingUpdate } from "./lib/pending-update";

export async function addTodo(userId: string, title: string): Promise<void> {
	await appDb.insert(todos).values({
		id: randomUUID(),
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		userId,
		syncStatus: "pending",
		deleted: false,
		attachmentUrl: null,
		attachmentLocalUri: null,
		attachmentStatus: null,
	});
}

export async function toggleTodo(id: string): Promise<void> {
	const [todo] = await appDb.select().from(todos).where(eq(todos.id, id));
	if (!todo) throw new Error(`Todo not found: ${id}`);

	await pendingUpdate(id, { completed: !todo.completed });
}

export async function updateTodoTitle(
	id: string,
	title: string,
): Promise<void> {
	await pendingUpdate(id, { title });
}

export async function deleteTodo(id: string): Promise<void> {
	await pendingUpdate(id, { deleted: true });
}

export async function resolveConflict(
	id: string,
	resolution: "local" | "server",
): Promise<void> {
	if (resolution === "local") {
		await pendingUpdate(id, {});
	} else {
		await appDb
			.update(todos)
			.set({ syncStatus: "synced" })
			.where(eq(todos.id, id));
	}
}

export async function attachFile(
	todoId: string,
	localUri: string,
): Promise<void> {
	await appDb
		.update(todos)
		.set({
			attachmentLocalUri: localUri,
			attachmentStatus: "queued",
		})
		.where(eq(todos.id, todoId));
}
