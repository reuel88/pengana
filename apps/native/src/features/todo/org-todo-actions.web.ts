import {
	addOrgTodo as _addOrgTodo,
	deleteOrgTodo as _deleteOrgTodo,
	resolveOrgConflict as _resolveOrgConflict,
	toggleOrgTodo as _toggleOrgTodo,
} from "@pengana/todo-client";
import { appDb } from "@/features/todo/entities/todo";
import {
	addMedia,
	getMediaCountForEntity,
	markMediaFailed,
	removeMedia,
	updateMediaUploaded,
} from "./todo-actions.web";

export const addOrgTodo = (
	organizationId: string,
	userId: string,
	title: string,
) => _addOrgTodo(appDb, organizationId, userId, title);

export const toggleOrgTodo = (id: string) => _toggleOrgTodo(appDb, id);

export const deleteOrgTodo = (id: string) => _deleteOrgTodo(appDb, id);

export const resolveOrgConflict = (
	id: string,
	resolution: "local" | "server",
) => _resolveOrgConflict(appDb, id, resolution);

export {
	addMedia as addOrgMedia,
	getMediaCountForEntity as getOrgMediaCountForEntity,
	markMediaFailed as markOrgMediaFailed,
	removeMedia as removeOrgMedia,
	updateMediaUploaded as updateOrgMediaUploaded,
};
