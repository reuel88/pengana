import type { Todo } from "@pengana/sync-engine";
import { useLiveQuery } from "dexie-react-hooks";

import { todoDb } from "@/entities/todo";

export function useTodos(userId: string) {
	const todos = useLiveQuery(
		() => todoDb.todos.where({ userId }).toArray(),
		[userId],
		[] as Todo[],
	);

	const activeTodos = todos.filter((t: Todo) => !t.deleted);
	const conflictTodos = todos.filter((t: Todo) => t.syncStatus === "conflict");

	return { todos: activeTodos, conflictTodos };
}
