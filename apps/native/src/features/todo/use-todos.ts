import { filterTodos } from "@pengana/todo-client";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import { db, todos } from "@/features/todo/entities/todo";

export function useTodos(userId: string) {
	const { data: allTodos } = useLiveQuery(
		db.select().from(todos).where(eq(todos.userId, userId)),
	);

	const { activeTodos, conflictTodos } = filterTodos(allTodos ?? []);

	return { todos: activeTodos, conflictTodos };
}

export function useOrgTodos(organizationId: string) {
	const { data: allTodos } = useLiveQuery(
		db.select().from(todos).where(eq(todos.userId, organizationId)),
	);

	const { activeTodos, conflictTodos } = filterTodos(allTodos ?? []);

	return { todos: activeTodos, conflictTodos };
}
