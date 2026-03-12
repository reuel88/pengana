// Web re-exports from the shared todo-client, except `updateTodoTitle` which
// needs a local implementation because the web entity layer (`todoDb`) uses a
// different update API than the native Drizzle layer. The native counterpart
// in `todo-actions.ts` operates directly on SQLite via Drizzle.
export {
	addTodo,
	attachFile,
	deleteTodo,
	resolveConflict,
	toggleTodo,
} from "@pengana/todo-client";

import { todoDb } from "@/features/todo/entities/todo";

export async function updateTodoTitle(
	id: string,
	title: string,
): Promise<void> {
	await todoDb.todos.update(id, {
		title,
		updatedAt: new Date().toISOString(),
		syncStatus: "pending",
	});
}
