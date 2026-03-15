import { createDexieActions, type EntityDatabase } from "@pengana/entity-store";

import type { WebOrgTodo } from "./db";

export async function addOrgTodo(
	db: EntityDatabase,
	organizationId: string,
	userId: string,
	title: string,
): Promise<void> {
	const actions = createDexieActions<WebOrgTodo>(db, "orgTodos");
	await actions.add({
		id: crypto.randomUUID(),
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		userId: organizationId, // sync engine uses userId as scope identifier
		organizationId,
		createdBy: userId,
		syncStatus: "pending",
		deleted: false,
	});
}

export async function toggleOrgTodo(
	db: EntityDatabase,
	id: string,
): Promise<void> {
	const todo = await db.getTable<WebOrgTodo>("orgTodos").get(id);
	if (!todo) throw new Error(`Org todo not found: ${id}`);

	const actions = createDexieActions<WebOrgTodo>(db, "orgTodos");
	await actions.update(id, { completed: !todo.completed });
}

export async function deleteOrgTodo(
	db: EntityDatabase,
	id: string,
): Promise<void> {
	const actions = createDexieActions<WebOrgTodo>(db, "orgTodos");
	await actions.softDelete(id);
}

export async function resolveOrgConflict(
	db: EntityDatabase,
	id: string,
	resolution: "local" | "server",
): Promise<void> {
	const actions = createDexieActions<WebOrgTodo>(db, "orgTodos");
	await actions.resolveConflict(id, resolution);
}
