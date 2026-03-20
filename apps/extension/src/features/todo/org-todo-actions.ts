import { createDexieActions } from "@pengana/entity-store";
import type { WebTodo } from "@pengana/todo-client";

import { appDb } from "@/shared/db";

const actions = createDexieActions<WebTodo>(appDb, "todos");

export async function addOrgTodo(
	organizationId: string,
	userId: string,
	title: string,
): Promise<void> {
	await actions.add({
		id: crypto.randomUUID(),
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		scopeId: organizationId,
		userId,
		organizationId,
		createdBy: userId,
		syncStatus: "pending",
		deleted: false,
		scopeType: "org",
	});
}

export {
	deleteTodo,
	deleteTodo as deleteOrgTodo,
	resolveConflict,
	resolveConflict as resolveOrgConflict,
	toggleTodo,
	toggleTodo as toggleOrgTodo,
} from "./todo-actions";
