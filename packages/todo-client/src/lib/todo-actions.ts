import { todoDb } from "../lib/db";

export async function addTodo(userId: string, title: string): Promise<void> {
	await todoDb.todos.add({
		id: crypto.randomUUID(),
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
	const todo = await todoDb.todos.get(id);
	if (!todo) throw new Error(`Todo not found: ${id}`);

	await todoDb.todos.update(id, {
		completed: !todo.completed,
		updatedAt: new Date().toISOString(),
		syncStatus: "pending",
	});
}

export async function deleteTodo(id: string): Promise<void> {
	await todoDb.todos.update(id, {
		deleted: true,
		updatedAt: new Date().toISOString(),
		syncStatus: "pending",
	});
}

export async function resolveConflict(
	id: string,
	resolution: "local" | "server",
): Promise<void> {
	if (resolution === "local") {
		await todoDb.todos.update(id, {
			updatedAt: new Date().toISOString(),
			syncStatus: "pending",
		});
	} else {
		// Mark as synced so the next sync pull overwrites with server data
		await todoDb.todos.update(id, {
			syncStatus: "synced",
		});
	}
}

export async function attachFile(
	todoId: string,
	localUri: string,
): Promise<void> {
	await todoDb.todos.update(todoId, {
		attachmentLocalUri: localUri,
		attachmentStatus: "queued",
	});
}
