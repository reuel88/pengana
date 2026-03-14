import type { EntityDatabase } from "@pengana/entity-store";
import type { UploadLifecycleCallbacks } from "@pengana/sync-engine";

import type { WebOrgTodo, WebTodo } from "./db";

export function createTodoUploadLifecycleCallbacks(
	db: EntityDatabase,
): UploadLifecycleCallbacks {
	const todosTable = db.getTable<WebTodo>("todos");
	const orgTodosTable = db.getTable<WebOrgTodo>("orgTodos");

	return {
		async onCompleted(
			entityType: string,
			entityId: string,
			attachmentUrl: string,
		): Promise<void> {
			const updateData = {
				attachmentUrl,
				attachmentStatus: "uploaded" as const,
				updatedAt: new Date().toISOString(),
				syncStatus: "pending" as const,
			};

			if (entityType === "orgTodo") {
				await orgTodosTable.update(entityId, updateData as never);
			} else {
				await todosTable.update(entityId, updateData as never);
			}
		},

		async onFailed(entityType: string, entityId: string): Promise<void> {
			const updateData = {
				attachmentStatus: "failed" as const,
				updatedAt: new Date().toISOString(),
			};

			if (entityType === "orgTodo") {
				await orgTodosTable.update(entityId, updateData as never);
			} else {
				await todosTable.update(entityId, updateData as never);
			}
		},
	};
}
