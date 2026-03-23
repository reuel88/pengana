/** Sync status for todo entities */
export type SyncStatus = "synced" | "pending" | "conflict";

/** Upload status for media/attachment entities */
export type UploadStatus = "queued" | "uploading" | "uploaded" | "failed";

/** Target entity for media attachment */
export interface MediaAttachmentTarget {
	entityType: string;
	entityId: string;
}

/** Media attachment metadata for grid display */
export interface MediaAttachmentInfo {
	id: string;
	entityType: string;
	entityId: string;
	position: number;
	createdAt: string;
}

/** Media item for grid display */
export interface MediaListItem {
	id: string;
	url: string | null;
	mimeType: string;
	status: UploadStatus | null;
	isLocalOnly: boolean;
	attachments: MediaAttachmentInfo[];
}
