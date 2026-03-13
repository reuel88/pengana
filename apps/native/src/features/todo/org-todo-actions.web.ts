import {
	addOrgTodo as _addOrgTodo,
	attachOrgFile as _attachOrgFile,
	deleteOrgTodo as _deleteOrgTodo,
	resolveOrgConflict as _resolveOrgConflict,
	toggleOrgTodo as _toggleOrgTodo,
} from "@pengana/todo-client";

import { appDb } from "@/features/todo/entities/todo";

export const addOrgTodo = (
	organizationId: string,
	userId: string,
	title: string,
) => _addOrgTodo(appDb, organizationId, userId, title);

export const toggleOrgTodo = (id: string) => _toggleOrgTodo(appDb, id);

export const deleteOrgTodo = (id: string) => _deleteOrgTodo(appDb, id);

export const attachOrgFile = (todoId: string, localUri: string) =>
	_attachOrgFile(appDb, todoId, localUri);

export const resolveOrgConflict = (
	id: string,
	resolution: "local" | "server",
) => _resolveOrgConflict(appDb, id, resolution);
