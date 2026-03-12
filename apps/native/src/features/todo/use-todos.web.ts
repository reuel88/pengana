import type { Todo } from "@pengana/sync-engine";
import { useLiveQuery } from "dexie-react-hooks";

import { todoDb } from "@/features/todo/entities/todo";

export function useTodos(userId: string) {
	const todos = useLiveQuery(
		() => todoDb.todos.where({ userId }).toArray(),
		[userId],
		[] as Todo[],
	);

	const activeTodos = todos.filter((todo: Todo) => !todo.deleted);
	const conflictTodos = todos.filter(
		(todo: Todo) => todo.syncStatus === "conflict",
	);

	return { todos: activeTodos, conflictTodos };
}
