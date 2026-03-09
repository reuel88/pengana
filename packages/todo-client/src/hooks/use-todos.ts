import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";

import { todoDb } from "../lib/db";

export function useTodos(userId: string) {
	const todos = useLiveQuery(
		() => todoDb.todos.where({ userId }).toArray(),
		[userId],
		[],
	);

	const activeTodos = useMemo(
		() => todos.filter((todo) => !todo.deleted),
		[todos],
	);
	const conflictTodos = useMemo(
		() => todos.filter((todo) => todo.syncStatus === "conflict"),
		[todos],
	);

	return { todos: activeTodos, conflictTodos };
}
