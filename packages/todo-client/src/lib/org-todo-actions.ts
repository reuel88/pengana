import { todoDb } from "../lib/db";

export async function addOrgTodo(
	organizationId: string,
	userId: string,
	title: string,
): Promise<void> {
	await todoDb.orgTodos.add({
		id: crypto.randomUUID(),
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		userId: organizationId, // sync engine uses userId as scope identifier
		organizationId,
		createdBy: userId,
		syncStatus: "pending",
		deleted: false,
		attachmentUrl: null,
		attachmentLocalUri: null,
		attachmentStatus: null,
	});
}

export async function toggleOrgTodo(id: string): Promise<void> {
	const todo = await todoDb.orgTodos.get(id);
	if (!todo) throw new Error(`Org todo not found: ${id}`);

	await todoDb.orgTodos.update(id, {
		completed: !todo.completed,
		updatedAt: new Date().toISOString(),
		syncStatus: "pending",
	});
}

export async function deleteOrgTodo(id: string): Promise<void> {
	await todoDb.orgTodos.update(id, {
		deleted: true,
		updatedAt: new Date().toISOString(),
		syncStatus: "pending",
	});
}

export async function attachOrgFile(
	todoId: string,
	localUri: string,
): Promise<void> {
	await todoDb.orgTodos.update(todoId, {
		attachmentLocalUri: localUri,
		attachmentStatus: "queued",
	});
}

export async function resolveOrgConflict(
	id: string,
	resolution: "local" | "server",
): Promise<void> {
	if (resolution === "local") {
		await todoDb.orgTodos.update(id, {
			updatedAt: new Date().toISOString(),
			syncStatus: "pending",
		});
	} else {
		await todoDb.orgTodos.update(id, {
			syncStatus: "synced",
		});
	}
}
