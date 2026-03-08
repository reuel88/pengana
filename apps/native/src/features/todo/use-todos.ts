import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import { db, todos } from "@/entities/todo";

export function useTodos(userId: string) {
	const { data: allTodos } = useLiveQuery(
		db.select().from(todos).where(eq(todos.userId, userId)),
	);

	const activeTodos = (allTodos ?? []).filter((todo) => !todo.deleted);
	const conflictTodos = (allTodos ?? []).filter(
		(todo) => todo.syncStatus === "conflict",
	);

	return { todos: activeTodos, conflictTodos };
}
