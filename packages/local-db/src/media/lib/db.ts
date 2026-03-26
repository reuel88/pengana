import type { SyncStatus } from "@pengana/sync/core";
import type { UploadStatus } from "@pengana/sync/upload";

export interface AddMediaOptions {
	userId: string;
	localUri: string;
	mimeType: string;
	scopeType: "personal" | "org";
	scopeId: string;
	organizationId: string;
	createdBy: string;
}

export interface LocalMedia {
	id: string;
	userId: string;
	url: string | null;
	localUri: string | null;
	status: UploadStatus | null;
	mimeType: string;
	createdAt: string;
	updatedAt: string;
	scopeType: "personal" | "org";
	scopeId: string;
	organizationId: string;
	createdBy: string;
	hlcTimestamp: string;
	fieldClocks: Record<string, string> | string;
	syncStatus: SyncStatus;
	deleted: boolean;
}

export interface LocalMediaAttachment {
	id: string;
	mediaId: string;
	entityType: string;
	entityId: string;
	position: number;
	createdAt: string;
}
