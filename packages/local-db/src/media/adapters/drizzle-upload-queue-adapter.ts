import type { UploadAdapter, UploadItem } from "@pengana/sync/upload";
import { isQuotaError, StorageFullError } from "@pengana/sync/upload";
import { asc, eq } from "drizzle-orm";

import type {
	BaseSQLiteDatabase,
	SQLiteColumn,
	SQLiteTable,
} from "drizzle-orm/sqlite-core";

type DrizzleDb = BaseSQLiteDatabase<"sync" | "async", unknown>;

type UploadQueueTable = SQLiteTable & {
	id: SQLiteColumn;
	fileUri: SQLiteColumn;
	mimeType: SQLiteColumn;
	entityType: SQLiteColumn;
	entityId: SQLiteColumn;
	status: SQLiteColumn;
	retryCount: SQLiteColumn;
	createdAt: SQLiteColumn;
};

export function createDrizzleUploadAdapter(
	db: DrizzleDb,
	table: UploadQueueTable,
): UploadAdapter {
	return {
		async addToQueue(item: UploadItem): Promise<void> {
			try {
				await db.insert(table).values({
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
			const [row] = await db
				.select()
				.from(table)
				.where(eq(table.status, "queued"))
				.orderBy(asc(table.createdAt))
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
			await db.update(table).set({ status }).where(eq(table.id, id));
		},

		async updateRetry(id: string, retryCount: number): Promise<void> {
			await db.update(table).set({ retryCount }).where(eq(table.id, id));
		},

		async markCompleted(id: string, _url: string): Promise<void> {
			await db
				.update(table)
				.set({ status: "uploaded" })
				.where(eq(table.id, id));
		},

		async markFailed(id: string): Promise<void> {
			await db.update(table).set({ status: "failed" }).where(eq(table.id, id));
		},

		async getQueueItems(): Promise<UploadItem[]> {
			const rows = await db.select().from(table).orderBy(asc(table.createdAt));

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
			await db.delete(table).where(eq(table.id, id));
		},
	};
}
