import type { EnqueueUploadParams } from "@pengana/upload-queue";

export interface ProcessMediaFileInput {
	file: File;
	userId: string;
	scopeType: "personal" | "org";
	scopeId: string;
	organizationId: string;
	target?: { entityType: string; entityId: string };
	storeFile: (id: string, file: File) => Promise<void> | void;
	createFileRef: (
		id: string,
		file: File,
	) => { uri: string; revoke?: () => void };
	enqueueUpload: (params: EnqueueUploadParams) => void;
}

export interface MediaActions {
	processMediaFile: (
		params: ProcessMediaFileInput,
	) => Promise<{ fileRef: { revoke?: () => void } }>;
	removeMedia: (mediaId: string) => Promise<void>;
	retryMedia: (mediaId: string) => Promise<{
		id: string;
		localUri: string | null;
		mimeType: string;
		scopeType?: string;
	} | null>;
	getAttachmentForMedia: (
		mediaId: string,
	) => Promise<{ entityType: string; entityId: string } | undefined>;
}
