import { filterTodos } from "@pengana/todo-client";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import { appDb, todos } from "@/features/todo/entities/todo";

export function useTodos(userId: string) {
	const { data: allTodos } = useLiveQuery(
		appDb.select().from(todos).where(eq(todos.userId, userId)),
	);

	const { activeTodos, conflictTodos } = filterTodos(allTodos ?? []);

	return { todos: activeTodos, conflictTodos };
}

export function useOrgTodos(organizationId: string) {
	const { data: allTodos } = useLiveQuery(
		appDb.select().from(todos).where(eq(todos.userId, organizationId)),
	);

	const { activeTodos, conflictTodos } = filterTodos(allTodos ?? []);

	return { todos: activeTodos, conflictTodos };
}
