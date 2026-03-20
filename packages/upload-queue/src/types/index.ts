export type { UploadItem, UploadStatus } from "../schemas/upload";

import type { UploadItem, UploadStatus } from "../schemas/upload";

export interface UploadAdapter {
	addToQueue(item: UploadItem): Promise<void>;
	getNextQueued(): Promise<UploadItem | null>;
	updateStatus(id: string, status: UploadStatus): Promise<void>;
	updateRetry(id: string, retryCount: number): Promise<void>;
	markCompleted(id: string, url: string): Promise<void>;
	markFailed(id: string): Promise<void>;
	getQueueItems(): Promise<UploadItem[]>;
	removeItem(id: string): Promise<void>;
}

export interface UploadTransport {
	upload(input: {
		fileUri: string;
		mimeType: string;
		idempotencyKey: string;
		entityType?: string;
		entityId?: string;
		scopeType?: "personal" | "org";
	}): Promise<{ url: string }>;
	onFailed?(fileUri: string): void | Promise<void>;
}

export type UploadEventType =
	| "upload:start"
	| "upload:progress"
	| "upload:complete"
	| "upload:error";

export interface UploadEvent {
	type: UploadEventType;
	timestamp: string;
	detail: string;
	itemId: string;
}

export interface UploadLifecycleCallbacks {
	onCompleted(attachmentUrl: string, uploadItemId: string): Promise<void>;
	onFailed(uploadItemId: string): Promise<void>;
}
