import type { UploadAdapter, UploadItem } from "@pengana/sync-engine";
import { isQuotaError, StorageFullError } from "@pengana/sync-engine";

import { asc, eq } from "drizzle-orm";

import { db } from "@/features/todo/entities/todo/db";
import { todos } from "@/features/todo/entities/todo/schema";
import { uploadQueue } from "./schema";

export function createNativeUploadAdapter(): UploadAdapter {
	return {
		async addToQueue(item: UploadItem): Promise<void> {
			try {
				await db.insert(uploadQueue).values({
					id: item.id,
					todoId: item.todoId,
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
			const [row] = await db
				.select()
				.from(uploadQueue)
				.where(eq(uploadQueue.status, "queued"))
				.orderBy(asc(uploadQueue.createdAt))
				.limit(1);

			if (!row) return null;

			return {
				id: row.id,
				todoId: row.todoId,
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
			await db
				.update(uploadQueue)
				.set({ status })
				.where(eq(uploadQueue.id, id));
		},

		async updateRetry(id: string, retryCount: number): Promise<void> {
			await db
				.update(uploadQueue)
				.set({ retryCount })
				.where(eq(uploadQueue.id, id));
		},

		async markCompleted(id: string, attachmentUrl: string): Promise<void> {
			const [item] = await db
				.select()
				.from(uploadQueue)
				.where(eq(uploadQueue.id, id));

			if (!item) return;

			await db
				.update(uploadQueue)
				.set({ status: "uploaded" })
				.where(eq(uploadQueue.id, id));

			await db
				.update(todos)
				.set({
					attachmentUrl,
					attachmentStatus: "uploaded",
					updatedAt: new Date().toISOString(),
					syncStatus: "pending",
				})
				.where(eq(todos.id, item.todoId));
		},

		async markFailed(id: string): Promise<void> {
			const [item] = await db
				.select()
				.from(uploadQueue)
				.where(eq(uploadQueue.id, id));

			if (!item) return;

			await db
				.update(uploadQueue)
				.set({ status: "failed" })
				.where(eq(uploadQueue.id, id));

			// Intentionally does NOT set syncStatus: 'pending'. A failed upload
			// should not trigger sync — the user should retry the upload.
			await db
				.update(todos)
				.set({
					attachmentStatus: "failed",
					updatedAt: new Date().toISOString(),
				})
				.where(eq(todos.id, item.todoId));
		},

		async getQueueItems(): Promise<UploadItem[]> {
			const rows = await db
				.select()
				.from(uploadQueue)
				.orderBy(asc(uploadQueue.createdAt));

			return rows.map((row) => ({
				id: row.id,
				todoId: row.todoId,
				fileUri: row.fileUri,
				mimeType: row.mimeType,
				status: row.status,
				retryCount: row.retryCount,
				createdAt: row.createdAt,
			}));
		},

		async removeItem(id: string): Promise<void> {
			await db.delete(uploadQueue).where(eq(uploadQueue.id, id));
		},
	};
}
