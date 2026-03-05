import type { UploadAdapter, UploadItem } from "@finance-tool-poc/sync-engine";

import { todoDb } from "./db";
import { uploadQueueDb } from "./upload-queue-db";

export function createWebUploadAdapter(): UploadAdapter {
	return {
		async addToQueue(item: UploadItem): Promise<void> {
			await uploadQueueDb.uploadQueue.add(item);
		},

		async getNextQueued(): Promise<UploadItem | null> {
			const items = await uploadQueueDb.uploadQueue
				.where("status")
				.equals("queued")
				.sortBy("createdAt");

			return items[0] ?? null;
		},

		async updateStatus(
			id: string,
			status: UploadItem["status"],
		): Promise<void> {
			await uploadQueueDb.uploadQueue.update(id, { status });
		},

		async updateRetry(id: string, retryCount: number): Promise<void> {
			await uploadQueueDb.uploadQueue.update(id, { retryCount });
		},

		// Cross-database write: uploadQueueDb and todoDb are separate Dexie databases,
		// so these updates are NOT atomic. If the second write fails, the databases
		// may be inconsistent. Dexie does not support cross-database transactions.
		async markCompleted(id: string, attachmentUrl: string): Promise<void> {
			const item = await uploadQueueDb.uploadQueue.get(id);
			if (!item) return;

			await uploadQueueDb.uploadQueue.update(id, { status: "uploaded" });

			await todoDb.todos.update(item.todoId, {
				attachmentUrl,
				attachmentStatus: "uploaded",
				updatedAt: new Date().toISOString(),
				syncStatus: "pending",
			});
		},

		async markFailed(id: string): Promise<void> {
			const item = await uploadQueueDb.uploadQueue.get(id);
			if (!item) return;

			await uploadQueueDb.uploadQueue.update(id, { status: "failed" });

			// Intentionally does NOT set syncStatus: 'pending'. A failed upload
			// should not trigger sync — the user should retry the upload.
			await todoDb.todos.update(item.todoId, {
				attachmentStatus: "failed",
				updatedAt: new Date().toISOString(),
			});
		},

		async getQueueItems(): Promise<UploadItem[]> {
			return uploadQueueDb.uploadQueue.orderBy("createdAt").toArray();
		},
	};
}
