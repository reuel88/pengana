import {
	addOrgTodo as _addOrgTodo,
	attachOrgFile as _attachOrgFile,
	deleteOrgTodo as _deleteOrgTodo,
	resolveOrgConflict as _resolveOrgConflict,
	toggleOrgTodo as _toggleOrgTodo,
} from "@pengana/todo-client";

import { todoDb } from "@/features/todo/entities/todo";

export const addOrgTodo = (
	organizationId: string,
	userId: string,
	title: string,
) => _addOrgTodo(todoDb, organizationId, userId, title);

export const toggleOrgTodo = (id: string) => _toggleOrgTodo(todoDb, id);

export const deleteOrgTodo = (id: string) => _deleteOrgTodo(todoDb, id);

export const attachOrgFile = (todoId: string, localUri: string) =>
	_attachOrgFile(todoDb, todoId, localUri);

export const resolveOrgConflict = (
	id: string,
	resolution: "local" | "server",
) => _resolveOrgConflict(todoDb, id, resolution);
