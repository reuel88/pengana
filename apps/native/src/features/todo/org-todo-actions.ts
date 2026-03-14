import { randomUUID } from "expo-crypto";

import { appDb, todos } from "@/features/todo/entities/todo";

export {
	attachFile as attachOrgFile,
	deleteTodo as deleteOrgTodo,
	resolveConflict as resolveOrgConflict,
	toggleTodo as toggleOrgTodo,
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
		attachmentUrl: null,
		attachmentLocalUri: null,
		attachmentStatus: null,
	});
}
