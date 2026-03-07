import { useLiveQuery } from "dexie-react-hooks";

import { todoDb } from "./db";

export function useTodos(userId: string) {
	const todos = useLiveQuery(
		() => todoDb.todos.where({ userId }).toArray(),
		[userId],
		[],
	);

	const activeTodos = todos.filter((todo) => !todo.deleted);
	const conflictTodos = todos.filter((todo) => todo.syncStatus === "conflict");

	return { todos: activeTodos, conflictTodos };
}
