import { HLC, serializeHlc } from "@pengana/sync/core";
import type { EntityDatabase } from "../dexie";
import { createDexieActions } from "../dexie";
import type { WebTodo } from "./db";
import type { TodoActions } from "./use-todo-handlers";

export interface DexieTodoScope {
	userId: string;
	scopeId: string;
	organizationId: string;
	scopeType: "personal" | "org";
}

export function createDexieTodoActions(
	db: EntityDatabase,
	scope: DexieTodoScope,
): TodoActions {
	const hlc = new HLC(crypto.randomUUID());
	const actions = createDexieActions<WebTodo>(db, "todos", {
		hlcNow: () => hlc.now(),
	});

	return {
		async addTodo(title: string): Promise<void> {
			const ts = serializeHlc(hlc.now());
			await actions.add({
				id: crypto.randomUUID(),
				title,
				completed: false,
				updatedAt: new Date().toISOString(),
				hlcTimestamp: ts,
				fieldClocks: { title: ts, completed: ts, deleted: ts },
				scopeId: scope.scopeId,
				userId: scope.userId,
				organizationId: scope.organizationId,
				createdBy: scope.userId,
				syncStatus: "pending",
				deleted: false,
				scopeType: scope.scopeType,
			});
		},

		async toggleTodo(id: string): Promise<void> {
			const todo = await db.getTable<WebTodo>("todos").get(id);
			if (!todo) throw new Error(`Todo not found: ${id}`);
			await actions.update(id, { completed: !todo.completed });
		},

		async deleteTodo(id: string): Promise<void> {
			await actions.softDelete(id);
		},

		async resolveConflict(
			id: string,
			resolution: "local" | "server",
		): Promise<void> {
			await actions.resolveConflict(id, resolution);
		},
	};
}
