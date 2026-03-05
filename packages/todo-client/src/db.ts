import type { Todo, UploadStatus } from "@finance-tool-poc/sync-engine";

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
		// v2: indexes unchanged, version bump forces Dexie to re-open after schema-less column changes
		this.version(2).stores({
			todos: "id, userId, syncStatus, updatedAt",
			syncMeta: "key",
		});
	}
}

/** Singleton — Dexie caches the connection; creating multiple instances causes errors. */
export const todoDb = new TodoDatabase();
