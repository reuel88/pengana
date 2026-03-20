import type { UploadAdapter, UploadItem } from "@pengana/upload-queue";
import { isQuotaError, StorageFullError } from "@pengana/upload-queue";

import { asc, eq } from "drizzle-orm";

import { appDb } from "@/shared/db/db";
import { uploadQueue } from "./schema";

export function createNativeUploadAdapter(): UploadAdapter {
	return {
		async addToQueue(item: UploadItem): Promise<void> {
			try {
				await appDb.insert(uploadQueue).values({
					id: item.id,
					fileUri: item.fileUri,
					mimeType: item.mimeType,
					entityType: item.entityType ?? null,
					entityId: item.entityId ?? null,
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
				fileUri: row.fileUri,
				mimeType: row.mimeType,
				entityType: row.entityType ?? undefined,
				entityId: row.entityId ?? undefined,
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
				fileUri: row.fileUri,
				mimeType: row.mimeType,
				entityType: row.entityType ?? undefined,
				entityId: row.entityId ?? undefined,
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
