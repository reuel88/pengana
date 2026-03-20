import { randomUUID } from "expo-crypto";

import { actions } from "./todo-actions";

export {
	deleteTodo as deleteOrgTodo,
	resolveConflict as resolveOrgConflict,
	toggleTodo as toggleOrgTodo,
} from "./todo-actions";

export async function addOrgTodo(
	organizationId: string,
	userId: string,
	title: string,
): Promise<void> {
	await actions.add({
		id: randomUUID(),
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		userId,
		scopeId: organizationId,
		organizationId,
		createdBy: userId,
		scopeType: "org",
		syncStatus: "pending",
		deleted: false,
	});
}
