import { type EntityDatabase, useDexieEntity } from "@pengana/entity-store";

import type { WebTodo } from "../lib/db";

export function useTodos(db: EntityDatabase, userId: string) {
	const { items, conflicts } = useDexieEntity<WebTodo>(db, "todos", userId);
	return { todos: items, conflictTodos: conflicts };
}
