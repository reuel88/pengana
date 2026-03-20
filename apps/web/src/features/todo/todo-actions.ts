import { createDexieActions } from "@pengana/entity-store";
import type { WebTodo } from "@pengana/todo-client";

import { appDb } from "@/shared/db";

const actions = createDexieActions<WebTodo>(appDb, "todos");

export async function addTodo(
	userId: string,
	title: string,
	organizationId: string,
): Promise<void> {
	await actions.add({
		id: crypto.randomUUID(),
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		scopeId: userId,
		userId,
		organizationId,
		createdBy: userId,
		syncStatus: "pending",
		deleted: false,
		scopeType: "personal",
	});
}

export async function toggleTodo(id: string): Promise<void> {
	const todo = await appDb.getTable<WebTodo>("todos").get(id);
	if (!todo) throw new Error(`Todo not found: ${id}`);
	await actions.update(id, { completed: !todo.completed });
}

export async function deleteTodo(id: string): Promise<void> {
	await actions.softDelete(id);
}

export async function resolveConflict(
	id: string,
	resolution: "local" | "server",
): Promise<void> {
	await actions.resolveConflict(id, resolution);
}
