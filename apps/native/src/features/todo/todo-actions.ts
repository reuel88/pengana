import { eq } from "drizzle-orm";
import { randomUUID } from "expo-crypto";

import { db, todos } from "@/features/todo/entities/todo";

export async function addTodo(userId: string, title: string): Promise<void> {
	await db.insert(todos).values({
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
	const [todo] = await db.select().from(todos).where(eq(todos.id, id));
	if (!todo) throw new Error(`Todo not found: ${id}`);

	await db
		.update(todos)
		.set({
			completed: !todo.completed,
			updatedAt: new Date().toISOString(),
			syncStatus: "pending",
		})
		.where(eq(todos.id, id));
}

export async function updateTodoTitle(
	id: string,
	title: string,
): Promise<void> {
	await db
		.update(todos)
		.set({
			title,
			updatedAt: new Date().toISOString(),
			syncStatus: "pending",
		})
		.where(eq(todos.id, id));
}

export async function deleteTodo(id: string): Promise<void> {
	await db
		.update(todos)
		.set({
			deleted: true,
			updatedAt: new Date().toISOString(),
			syncStatus: "pending",
		})
		.where(eq(todos.id, id));
}

export async function resolveConflict(
	id: string,
	resolution: "local" | "server",
): Promise<void> {
	if (resolution === "local") {
		await db
			.update(todos)
			.set({
				updatedAt: new Date().toISOString(),
				syncStatus: "pending",
			})
			.where(eq(todos.id, id));
	} else {
		await db
			.update(todos)
			.set({ syncStatus: "synced" })
			.where(eq(todos.id, id));
	}
}

export async function attachFile(
	todoId: string,
	localUri: string,
): Promise<void> {
	await db
		.update(todos)
		.set({
			attachmentLocalUri: localUri,
			attachmentStatus: "queued",
		})
		.where(eq(todos.id, todoId));
}
