import type { UploadAdapter, UploadItem } from "@pengana/sync-engine";
import { isQuotaError, StorageFullError } from "@pengana/sync-engine";

import { asc, eq } from "drizzle-orm";

import { appDb } from "@/features/todo/entities/todo/db";
import { uploadQueue } from "./schema";

export function createNativeUploadAdapter(): UploadAdapter {
	return {
		async addToQueue(item: UploadItem): Promise<void> {
			try {
				await appDb.insert(uploadQueue).values({
					id: item.id,
					entityType: item.entityType,
					entityId: item.entityId,
					fileUri: item.fileUri,
					mimeType: item.mimeType,
					status: item.status,
					retryCount: item.retryCount,
					createdAt: item.createdAt,
				});
			} catch (e) {
				if (isQuotaError(e)) throw new StorageFullError();
				throw e;
			}
		},

		async getNextQueued(): Promise<UploadItem | null> {
			const [row] = await appDb
				.select()
				.from(uploadQueue)
				.where(eq(uploadQueue.status, "queued"))
				.orderBy(asc(uploadQueue.createdAt))
				.limit(1);

			if (!row) return null;

			return {
				id: row.id,
				entityType: row.entityType,
				entityId: row.entityId,
				fileUri: row.fileUri,
				mimeType: row.mimeType,
				status: row.status,
				retryCount: row.retryCount,
				createdAt: row.createdAt,
			};
		},

		async updateStatus(
			id: string,
			status: UploadItem["status"],
		): Promise<void> {
			await appDb
				.update(uploadQueue)
				.set({ status })
				.where(eq(uploadQueue.id, id));
		},

		async updateRetry(id: string, retryCount: number): Promise<void> {
			await appDb
				.update(uploadQueue)
				.set({ retryCount })
				.where(eq(uploadQueue.id, id));
		},

		async markCompleted(id: string, _url: string): Promise<void> {
			await appDb
				.update(uploadQueue)
				.set({ status: "uploaded" })
				.where(eq(uploadQueue.id, id));
		},

		async markFailed(id: string): Promise<void> {
			await appDb
				.update(uploadQueue)
				.set({ status: "failed" })
				.where(eq(uploadQueue.id, id));
		},

		async getQueueItems(): Promise<UploadItem[]> {
			const rows = await appDb
				.select()
				.from(uploadQueue)
				.orderBy(asc(uploadQueue.createdAt));

			return rows.map((row) => ({
				id: row.id,
				entityType: row.entityType,
				entityId: row.entityId,
				fileUri: row.fileUri,
				mimeType: row.mimeType,
				status: row.status,
				retryCount: row.retryCount,
				createdAt: row.createdAt,
			}));
		},

		async removeItem(id: string): Promise<void> {
			await appDb.delete(uploadQueue).where(eq(uploadQueue.id, id));
		},
	};
}
