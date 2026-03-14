import type { UploadItem } from "@pengana/sync-engine";

import Dexie, { type EntityTable } from "dexie";

export interface FileDataRecord {
	entityId: string;
	base64: string;
	mimeType: string;
	fileName: string;
}

export class UploadQueueDatabase extends Dexie {
	uploadQueue!: EntityTable<UploadItem, "id">;
	fileData!: EntityTable<FileDataRecord, "entityId">;

	constructor() {
		super("UploadQueueDatabase");
		this.version(1).stores({
			uploadQueue: "id, todoId, status, createdAt",
		});
		// v2: Added fileData table for storing base64 file blobs before upload
		this.version(2).stores({
			uploadQueue: "id, todoId, status, createdAt",
			fileData: "todoId",
		});
		// v3: Migrate uploadQueue columns, drop fileData (Dexie can't change primary keys)
		this.version(3)
			.stores({
				uploadQueue: "id, entityType, entityId, status, createdAt",
				fileData: null,
			})
			.upgrade((tx) => {
				return tx
					.table("uploadQueue")
					.toCollection()
					.modify((item: Record<string, unknown>) => {
						if (!item.entityType) {
							item.entityType = "todo";
						}
						if (!item.entityId && item.todoId) {
							item.entityId = item.todoId;
						}
						delete item.todoId;
					});
			});
		// v4: Recreate fileData with entityId as primary key
		this.version(4).stores({
			fileData: "entityId",
		});
	}
}

/** Singleton — Dexie caches the connection; creating multiple instances causes errors. */
export const uploadQueueDb = new UploadQueueDatabase();
