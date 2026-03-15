import { randomUUID } from "expo-crypto";

import { appDb, todos } from "@/features/todo/entities/todo";

export {
	addMedia as addOrgMedia,
	deleteTodo as deleteOrgTodo,
	getMediaCountForEntity as getOrgMediaCountForEntity,
	markMediaFailed as markOrgMediaFailed,
	removeMedia as removeOrgMedia,
	resolveConflict as resolveOrgConflict,
	toggleTodo as toggleOrgTodo,
	updateMediaUploaded as updateOrgMediaUploaded,
} from "./todo-actions";

export async function addOrgTodo(
	organizationId: string,
	userId: string,
	title: string,
): Promise<void> {
	await appDb.insert(todos).values({
		id: randomUUID(),
		title,
		completed: false,
		updatedAt: new Date().toISOString(),
		userId: organizationId,
		organizationId,
		createdBy: userId,
		syncStatus: "pending",
		deleted: false,
	});
}
