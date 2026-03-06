import type { SyncEvent, UploadEvent } from "@pengana/sync-engine";

// Messages from popup → background
export type BackgroundMessage =
	| { type: "init"; userId: string }
	| { type: "sync:trigger" }
	| {
			type: "upload:enqueue";
			payload: { todoId: string; fileUri: string; mimeType: string };
	  }
	| { type: "status:get" };

// Messages from background → popup (via sendMessage broadcast)
export type BackgroundBroadcast =
	| { type: "sync:event"; event: SyncEvent }
	| { type: "upload:event"; event: UploadEvent }
	| { type: "status:update"; status: SyncStatus };

export interface SyncStatus {
	isOnline: boolean;
	isSyncing: boolean;
	isUploading: boolean;
	userId: string | null;
}
