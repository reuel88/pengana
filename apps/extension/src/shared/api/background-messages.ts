import type {
	StorageLevel,
	SyncEvent,
	UploadEvent,
} from "@pengana/sync-engine";

export type SyncScopeType = "personal" | "organization";

export interface SyncScope {
	scopeType: SyncScopeType;
	scopeId: string;
}

// Messages from popup → background
export type BackgroundMessage =
	| ({ type: "init" } & SyncScope)
	| ({ type: "sync:trigger" } & SyncScope)
	| {
			type: "upload:enqueue";
			scopeType: SyncScopeType;
			scopeId: string;
			payload: { todoId: string; fileUri: string; mimeType: string };
	  }
	| ({ type: "status:get" } & SyncScope);

// Messages from background → popup (via sendMessage broadcast)
export type BackgroundBroadcast =
	| ({ type: "sync:event"; event: SyncEvent } & SyncScope)
	| ({ type: "upload:event"; event: UploadEvent } & SyncScope)
	| { type: "status:update"; status: SyncStatus }
	| ({ type: "storage:critical" } & SyncScope);

export interface SyncStatus extends SyncScope {
	isOnline: boolean;
	isSyncing: boolean;
	isUploading: boolean;
	storageLevel: StorageLevel;
}

export type MessageResponseMap = {
	init: { ok: true } | { ok: false; error: string };
	"sync:trigger": { ok: true } | { ok: false; error: string };
	"status:get": SyncStatus;
	"upload:enqueue": { ok: true } | { ok: false; error: string };
};

/** Returns `true` on start, `false` on complete/error, `null` for no state change. */
export function isSyncActive(event: SyncEvent): boolean | null {
	if (event.type === "sync:start") return true;
	if (event.type === "sync:complete" || event.type === "sync:error")
		return false;
	return null;
}

/** Returns `true` on start, `false` on complete/error, `null` for no state change. */
export function isUploadActive(event: UploadEvent): boolean | null {
	if (event.type === "upload:start") return true;
	if (event.type === "upload:complete" || event.type === "upload:error")
		return false;
	return null;
}
