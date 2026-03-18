import type { EntityDatabase } from "@pengana/entity-store";
import { isAllowedMimeType, MAX_FILE_SIZE_BYTES } from "@pengana/sync-engine";
import { useCallback } from "react";
import { processMediaFile } from "../lib/media-actions";
import type {
	MediaAttachmentTarget,
	MediaFileStorageStrategy,
} from "./use-media-handlers";

export interface FileSelectionDeps {
	db?: EntityDatabase;
	userId: string;
	scopeType: "personal" | "org";
	scopeId: string;
	organizationId: string;
	fileStorage: MediaFileStorageStrategy;
	enqueueUpload: (
		fileUri: string,
		mimeType: string,
		mediaId: string,
		entityType?: string,
		entityId?: string,
		scopeType?: "personal" | "org",
	) => void;
	triggerSync: () => void;
	onError?: (id: string | null, message: string) => void;
	t: (key: string) => string;
}

export function useFileSelection(deps: FileSelectionDeps) {
	const {
		db,
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
			if (!db) return;
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
					db,
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
			db,
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
