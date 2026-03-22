import { createDexieActions } from "@pengana/entity-store";
import { HLC, serializeHlc } from "@pengana/sync/core";
import type { WebTodo } from "@pengana/todo-client";

import { appDb } from "@/shared/db";

const hlc = new HLC(crypto.randomUUID());

const actions = createDexieActions<WebTodo>(appDb, "todos", {
	hlcNow: () => hlc.now(),
});

export async function addTodo(
	userId: string,
	title: string,
	organizationId: string,
): Promise<void> {
	const ts = serializeHlc(hlc.now());
	await actions.add({
		id: crypto.randomUUID(),
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		hlcTimestamp: ts,
		fieldClocks: { title: ts, completed: ts, deleted: ts },
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
