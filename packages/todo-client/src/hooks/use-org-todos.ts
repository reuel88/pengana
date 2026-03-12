import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";

import { todoDb } from "../lib/db";

export function useOrgTodos(organizationId: string) {
	const todos = useLiveQuery(
		() => todoDb.orgTodos.where({ userId: organizationId }).toArray(),
		[organizationId],
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
