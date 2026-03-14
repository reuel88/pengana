import type { UploadAdapter, UploadItem } from "@pengana/sync-engine";
import { isQuotaError, StorageFullError } from "@pengana/sync-engine";

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

		async markCompleted(id: string, _attachmentUrl: string): Promise<void> {
			await uploadQueueDb.uploadQueue.update(id, { status: "uploaded" });
		},

		async markFailed(id: string): Promise<void> {
			await uploadQueueDb.uploadQueue.update(id, { status: "failed" });
		},

		async getQueueItems(): Promise<UploadItem[]> {
			return uploadQueueDb.uploadQueue.orderBy("createdAt").toArray();
		},

		async removeItem(id: string): Promise<void> {
			await uploadQueueDb.uploadQueue.delete(id);
		},
	};
}
