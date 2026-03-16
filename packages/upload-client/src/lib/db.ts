import type { UploadStatus } from "@pengana/sync-engine";

export interface WebMedia {
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
	organizationId: string | null;
	createdBy: string | null;
}

export interface WebMediaAttachment {
	id: string;
	mediaId: string;
	entityType: string;
	entityId: string;
	position: number;
	createdAt: string;
}
