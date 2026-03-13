// Web re-exports from the shared todo-client, except `updateTodoTitle` which
// needs a local implementation because the web entity layer (`todoDb`) uses a
// different update API than the native Drizzle layer. The native counterpart
// in `todo-actions.ts` operates directly on SQLite via Drizzle.
import type { WebTodo } from "@pengana/todo-client";
import {
	addTodo as _addTodo,
	attachFile as _attachFile,
	deleteTodo as _deleteTodo,
	resolveConflict as _resolveConflict,
	toggleTodo as _toggleTodo,
} from "@pengana/todo-client";

import { todoDb } from "@/features/todo/entities/todo";

export const addTodo = (userId: string, title: string) =>
	_addTodo(todoDb, userId, title);
export const toggleTodo = (id: string) => _toggleTodo(todoDb, id);
export const deleteTodo = (id: string) => _deleteTodo(todoDb, id);
export const resolveConflict = (id: string, resolution: "local" | "server") =>
	_resolveConflict(todoDb, id, resolution);
export const attachFile = (todoId: string, localUri: string) =>
	_attachFile(todoDb, todoId, localUri);

export async function updateTodoTitle(
	id: string,
	title: string,
): Promise<void> {
	await todoDb.getTable<WebTodo>("todos").update(id, {
		title,
		updatedAt: new Date().toISOString(),
		syncStatus: "pending",
	} as never);
}
