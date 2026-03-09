import type { Todo, UploadStatus } from "@pengana/sync-engine";

import Dexie, { type EntityTable } from "dexie";

interface SyncMeta {
	key: string;
	value: string;
}

export interface WebTodo extends Todo {
	attachmentLocalUri: string | null;
	attachmentStatus: UploadStatus | null;
}

export class TodoDatabase extends Dexie {
	todos!: EntityTable<WebTodo, "id">;
	syncMeta!: EntityTable<SyncMeta, "key">;

	constructor() {
		super("TodoDatabase");
		this.version(1).stores({
			todos: "id, userId, syncStatus, updatedAt",
			syncMeta: "key",
		});
		// v2: indexes are identical to v1. The version bump is required because Dexie
		// only re-opens the database when it detects a new version — without this,
		// non-indexed column additions (e.g. attachmentLocalUri) are silently ignored.
		this.version(2).stores({
			todos: "id, userId, syncStatus, updatedAt",
			syncMeta: "key",
		});
	}
}

/** Singleton — Dexie caches the connection; creating multiple instances causes errors. */
export const todoDb = new TodoDatabase();
