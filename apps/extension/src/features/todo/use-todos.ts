import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";

import { todoDb } from "@/entities/todo";

export function useTodos(userId: string) {
	const todos = useLiveQuery(
		() => todoDb.todos.where({ userId }).toArray(),
		[userId],
		[],
	);

	const activeTodos = useMemo(() => todos.filter((t) => !t.deleted), [todos]);

	return { todos: activeTodos };
}
