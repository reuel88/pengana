// Web re-exports from the shared todo-client, except `updateTodoTitle` which
// needs a local implementation because the web entity layer (`appDb`) uses a
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

import { appDb } from "@/features/todo/entities/todo";

export const addTodo = (userId: string, title: string) =>
	_addTodo(appDb, userId, title);
export const toggleTodo = (id: string) => _toggleTodo(appDb, id);
export const deleteTodo = (id: string) => _deleteTodo(appDb, id);
export const resolveConflict = (id: string, resolution: "local" | "server") =>
	_resolveConflict(appDb, id, resolution);
export const attachFile = (todoId: string, localUri: string) =>
	_attachFile(appDb, todoId, localUri);

export async function updateTodoTitle(
	id: string,
	title: string,
): Promise<void> {
	await appDb.getTable<WebTodo>("todos").update(id, {
		title,
		updatedAt: new Date().toISOString(),
		syncStatus: "pending",
	} as never);
}
