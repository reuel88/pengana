import type { EnqueueUploadParams } from "@pengana/upload-queue";
import { isAllowedMimeType, MAX_FILE_SIZE_BYTES } from "@pengana/upload-queue";
import { useCallback } from "react";
import type { MediaActions } from "./media-actions";
import type {
	MediaAttachmentTarget,
	MediaFileStorageStrategy,
} from "./use-media-handlers";

export interface FileSelectionDeps {
	processMediaFile: MediaActions["processMediaFile"];
	userId: string;
	scopeType: "personal" | "org";
	scopeId: string;
	organizationId: string;
	fileStorage: MediaFileStorageStrategy;
	enqueueUpload: (params: EnqueueUploadParams) => void;
	triggerSync: () => void;
	onError?: (id: string | null, message: string) => void;
	t: (key: string) => string;
}

export function useFileSelection(deps: FileSelectionDeps) {
	const {
		processMediaFile,
		userId,
		scopeType,
		scopeId,
		organizationId,
		fileStorage: { storeFile, createFileRef },
		enqueueUpload,
		triggerSync,
		onError,
		t,
	} = deps;

	return useCallback(
		async (files: File[], target?: MediaAttachmentTarget) => {
			const refs: Array<{ revoke?: () => void }> = [];

			for (const file of files) {
				if (!isAllowedMimeType(file.type)) {
					onError?.(null, t("dropzone.rejected.type"));
					continue;
				}

				if (file.size > MAX_FILE_SIZE_BYTES) {
					onError?.(null, t("dropzone.rejected.size"));
					continue;
				}

				const { fileRef } = await processMediaFile({
					file,
					userId,
					scopeType,
					scopeId,
					organizationId,
					target,
					storeFile,
					createFileRef,
					enqueueUpload,
				});
				refs.push(fileRef);
			}

			triggerSync();
		},
		[
			processMediaFile,
			storeFile,
			createFileRef,
			userId,
			scopeType,
			scopeId,
			organizationId,
			enqueueUpload,
			triggerSync,
			onError,
			t,
		],
	);
}
