import type { Todo } from "@pengana/sync-engine";
import type { WebOrgTodo } from "@pengana/todo-client";
import { filterTodos } from "@pengana/todo-client";
import { useLiveQuery } from "dexie-react-hooks";

import { todoDb } from "@/features/todo/entities/todo";

export function useTodos(userId: string) {
	const todos = useLiveQuery(
		() => todoDb.getTable<Todo>("todos").where({ userId }).toArray(),
		[userId],
		[] as Todo[],
	);

	const { activeTodos, conflictTodos } = filterTodos(todos);

	return { todos: activeTodos, conflictTodos };
}

export function useOrgTodos(organizationId: string) {
	const todos = useLiveQuery(
		() =>
			todoDb
				.getTable<WebOrgTodo>("orgTodos")
				.where({ userId: organizationId })
				.toArray(),
		[organizationId],
		[] as WebOrgTodo[],
	);

	const { activeTodos, conflictTodos } = filterTodos(todos);

	return { todos: activeTodos, conflictTodos };
}
