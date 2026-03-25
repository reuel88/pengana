import type { EnqueueUploadParams } from "@pengana/sync/upload";
import {
	isAllowedMimeType,
	isQuotaError,
	MAX_FILE_SIZE_BYTES,
} from "@pengana/sync/upload";
import { useCallback, useMemo } from "react";
import type { MediaConfig } from "../lib/media-config";
import type { MediaActions } from "./media-actions";

export interface MediaFileStorageStrategy {
	storeFile: (id: string, file: File) => Promise<void> | void;
	createFileRef: (
		id: string,
		file: File,
	) => { uri: string; revoke?: () => void };
}

export interface MediaAttachmentTarget {
	entityType: string;
	entityId: string;
}

export interface MediaHandlerDeps {
	actions: MediaActions;
	userId: string;
	scopeId: string;
	organizationId: string;
	config: MediaConfig;
	fileStorage: MediaFileStorageStrategy;
	t: (key: string) => string;
	deleteMedia?: (mediaId: string) => Promise<unknown>;
	onError?: (id: string | null, message: string) => void;
	onDeleteSuccess?: (mediaId: string) => void;
}

export function useMediaHandlers(deps: MediaHandlerDeps) {
	const {
		actions,
		userId,
		scopeId,
		organizationId,
		config,
		fileStorage,
		t,
		deleteMedia: deleteMediaOnServer,
		onError,
		onDeleteSuccess,
	} = deps;

	const handleFileSelected = useCallback(
		async (
			file: File,
			target?: MediaAttachmentTarget,
		): Promise<EnqueueUploadParams | null> => {
			if (!isAllowedMimeType(file.type)) {
				onError?.(null, t("dropzone.rejected.type"));
				return null;
			}
			if (file.size > MAX_FILE_SIZE_BYTES) {
				onError?.(null, t("dropzone.rejected.size"));
				return null;
			}

			try {
				const result = await actions.processMediaFile({
					file,
					userId,
					scopeType: config.scopeType,
					scopeId,
					organizationId,
					target,
					storeFile: fileStorage.storeFile,
					createFileRef: fileStorage.createFileRef,
				});
				return result.enqueueParams;
			} catch (error) {
				onError?.(
					target?.entityId ?? null,
					isQuotaError(error) ? t("errors:storageFull") : t("upload.error"),
				);
				return null;
			}
		},
		[
			actions,
			userId,
			config.scopeType,
			scopeId,
			organizationId,
			fileStorage,
			onError,
			t,
		],
	);

	const handleDelete = useCallback(
		async (mediaId: string) => {
			try {
				await actions.removeMedia(mediaId);
				await deleteMediaOnServer?.(mediaId);
				onDeleteSuccess?.(mediaId);
			} catch (error) {
				onError?.(
					mediaId,
					isQuotaError(error) ? t("errors:storageFull") : t("upload.error"),
				);
			}
		},
		[actions, deleteMediaOnServer, onDeleteSuccess, onError, t],
	);

	const handleRetry = useCallback(
		async (mediaId: string): Promise<EnqueueUploadParams | null> => {
			try {
				const record = await actions.retryMedia(mediaId);
				if (!record?.localUri) return null;

				const attachment = await actions.getAttachmentForMedia(mediaId);

				return {
					fileUri: record.localUri,
					mimeType: record.mimeType,
					mediaId: record.id,
					entityType: attachment?.entityType,
					entityId: attachment?.entityId,
					scopeType: attachment
						? undefined
						: (record.scopeType as "personal" | "org" | undefined),
				};
			} catch (error) {
				onError?.(
					mediaId,
					isQuotaError(error) ? t("errors:storageFull") : t("upload.error"),
				);
				return null;
			}
		},
		[actions, onError, t],
	);

	return useMemo(
		() => ({
			handleDelete,
			handleFileSelected,
			handleRetry,
		}),
		[handleDelete, handleFileSelected, handleRetry],
	);
}
