import type { Todo } from "@pengana/sync-engine";
import { filterTodos } from "@pengana/todo-client";
import { useLiveQuery } from "dexie-react-hooks";

import { todoDb } from "@/features/todo/entities/todo";

export function useTodos(userId: string) {
	const todos = useLiveQuery(
		() => todoDb.todos.where({ userId }).toArray(),
		[userId],
		[] as Todo[],
	);

	const { activeTodos, conflictTodos } = filterTodos(todos);

	return { todos: activeTodos, conflictTodos };
}
