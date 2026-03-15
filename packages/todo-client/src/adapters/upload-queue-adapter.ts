import type { EntityDatabase } from "@pengana/entity-store";
import type { UploadAdapter, UploadItem } from "@pengana/sync-engine";
import { isQuotaError, StorageFullError } from "@pengana/sync-engine";

export function createWebUploadAdapter(db: EntityDatabase): UploadAdapter {
	const table = db.getTable<UploadItem>("uploadQueue");

	return {
		async addToQueue(item: UploadItem): Promise<void> {
			try {
				await table.add(item);
			} catch (e) {
				if (isQuotaError(e)) throw new StorageFullError();
				throw e;
			}
		},

		async getNextQueued(): Promise<UploadItem | null> {
			const items = await table
				.where("status")
				.equals("queued")
				.sortBy("createdAt");

			return items[0] ?? null;
		},

		async updateStatus(
			id: string,
			status: UploadItem["status"],
		): Promise<void> {
			await table.update(id, { status });
		},

		async updateRetry(id: string, retryCount: number): Promise<void> {
			await table.update(id, { retryCount });
		},

		async markCompleted(id: string, _url: string): Promise<void> {
			await table.update(id, { status: "uploaded" });
		},

		async markFailed(id: string): Promise<void> {
			await table.update(id, { status: "failed" });
		},

		async getQueueItems(): Promise<UploadItem[]> {
			return table.orderBy("createdAt").toArray();
		},

		async removeItem(id: string): Promise<void> {
			await table.delete(id);
		},
	};
}
