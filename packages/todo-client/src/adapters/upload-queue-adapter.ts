import type { UploadAdapter, UploadItem } from "@pengana/sync-engine";
import { isQuotaError, StorageFullError } from "@pengana/sync-engine";

import { todoDb } from "../lib/db";
import { uploadQueueDb } from "../lib/upload-queue-db";

export function createWebUploadAdapter(): UploadAdapter {
	return {
		async addToQueue(item: UploadItem): Promise<void> {
			try {
				await uploadQueueDb.uploadQueue.add(item);
			} catch (e) {
				if (isQuotaError(e)) throw new StorageFullError();
				throw e;
			}
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
		// so these updates are NOT atomic. Dexie does not support cross-database transactions.
		// Write ordering: uploadQueueDb is updated first so that if the todoDb write
		// fails, the upload is still marked as done and won't be retried. The worst
		// case is the todo row keeps stale attachment metadata until the next sync.
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

		async removeItem(id: string): Promise<void> {
			await uploadQueueDb.uploadQueue.delete(id);
		},
	};
}
