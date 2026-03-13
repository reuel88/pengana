import { createDexieActions, type EntityDatabase } from "@pengana/entity-store";

import type { WebTodo } from "./db";

export async function addTodo(
	db: EntityDatabase,
	userId: string,
	title: string,
): Promise<void> {
	const actions = createDexieActions<WebTodo>(db, "todos");
	await actions.add({
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

export async function toggleTodo(
	db: EntityDatabase,
	id: string,
): Promise<void> {
	const todo = await db.getTable<WebTodo>("todos").get(id);
	if (!todo) throw new Error(`Todo not found: ${id}`);

	const actions = createDexieActions<WebTodo>(db, "todos");
	await actions.update(id, { completed: !todo.completed });
}

export async function deleteTodo(
	db: EntityDatabase,
	id: string,
): Promise<void> {
	const actions = createDexieActions<WebTodo>(db, "todos");
	await actions.softDelete(id);
}

export async function resolveConflict(
	db: EntityDatabase,
	id: string,
	resolution: "local" | "server",
): Promise<void> {
	const actions = createDexieActions<WebTodo>(db, "todos");
	await actions.resolveConflict(id, resolution);
}

export async function attachFile(
	db: EntityDatabase,
	todoId: string,
	localUri: string,
): Promise<void> {
	// attachFile doesn't go through sync — it only updates local fields
	await db.getTable<WebTodo>("todos").update(todoId, {
		attachmentLocalUri: localUri,
		attachmentStatus: "queued",
	} as never);
}
