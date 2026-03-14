import type { UploadLifecycleCallbacks } from "@pengana/sync-engine";
import { eq } from "drizzle-orm";

import { appDb } from "@/features/todo/entities/todo/db";
import { todos } from "@/features/todo/entities/todo/schema";

export function createNativeUploadLifecycleCallbacks(): UploadLifecycleCallbacks {
	return {
		async onCompleted(
			_entityType: string,
			entityId: string,
			attachmentUrl: string,
		): Promise<void> {
			await appDb
				.update(todos)
				.set({
					attachmentUrl,
					attachmentStatus: "uploaded",
					updatedAt: new Date().toISOString(),
					syncStatus: "pending",
				})
				.where(eq(todos.id, entityId));
		},

		async onFailed(_entityType: string, entityId: string): Promise<void> {
			await appDb
				.update(todos)
				.set({
					attachmentStatus: "failed",
					updatedAt: new Date().toISOString(),
				})
				.where(eq(todos.id, entityId));
		},
	};
}
