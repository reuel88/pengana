import type { UploadStatus } from "@pengana/sync-engine";

export interface WebMedia {
	id: string;
	entityId: string | null;
	entityType: string | null;
	userId: string;
	url: string | null;
	localUri: string | null;
	status: UploadStatus | null;
	mimeType: string;
	position: number;
	createdAt: string;
}
