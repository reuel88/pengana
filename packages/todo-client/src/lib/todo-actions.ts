import { createDexieActions, type EntityDatabase } from "@pengana/entity-store";

import type { WebTodo } from "./db";
import type { TodoConfig } from "./todo-config";

export function createTodoActions(db: EntityDatabase, config: TodoConfig) {
	const tableName = config.entity.name;

	return {
		async addTodo(
			scopeId: string,
			actorId: string,
			organizationId: string,
			title: string,
		): Promise<void> {
			const actions = createDexieActions<WebTodo>(db, tableName);
			await actions.add({
				id: crypto.randomUUID(),
				...config.buildNewTodo({ scopeId, actorId, organizationId, title }),
			});
		},

		async toggleTodo(id: string): Promise<void> {
			const todo = await db.getTable<WebTodo>(tableName).get(id);
			if (!todo) throw new Error(`Todo not found: ${id}`);

			const actions = createDexieActions<WebTodo>(db, tableName);
			await actions.update(id, { completed: !todo.completed });
		},

		async deleteTodo(id: string): Promise<void> {
			const actions = createDexieActions<WebTodo>(db, tableName);
			await actions.softDelete(id);
		},

		async resolveConflict(
			id: string,
			resolution: "local" | "server",
		): Promise<void> {
			const actions = createDexieActions<WebTodo>(db, tableName);
			await actions.resolveConflict(id, resolution);
		},
	};
}
