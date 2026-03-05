import { useLiveQuery } from "dexie-react-hooks";

import { todoDb } from "@/entities/todo";

export function useTodos(userId: string) {
	const todos = useLiveQuery(
		() => todoDb.todos.where({ userId }).toArray(),
		[userId],
		[],
	);

	const activeTodos = todos.filter((t) => !t.deleted);
	const conflictTodos = todos.filter((t) => t.syncStatus === "conflict");

	return { todos: activeTodos, conflictTodos };
}
