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

	localUri: string | null;
	mimeType: string;
	url: string | null;

	userId: string;
	scopeId: string;
	organizationId: string;
	scopeType: "personal" | "org";

	createdAt: string;
	updatedAt: string;
	createdBy: string;
	hlcTimestamp: string;
	fieldClocks: Record<string, string> | string;

	status: UploadStatus | null;
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
