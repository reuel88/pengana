import type { EnqueueUploadParams } from "@pengana/sync/upload";
import { isQuotaError } from "@pengana/sync/upload";
import { useCallback, useMemo } from "react";
import type { MediaConfig } from "../lib/media-config";
import type { MediaActions } from "./media-actions";
import { useFileSelection } from "./use-file-selection";
import { useMediaDeletion } from "./use-media-deletion";
import { useMediaRetry } from "./use-media-retry";

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
	triggerSync: () => void;
	enqueueUpload: (params: EnqueueUploadParams) => void;
	userId: string;
	scopeId: string;
	organizationId: string;
	config: MediaConfig;
	fileStorage: MediaFileStorageStrategy;
	t: (key: string) => string;
	deleteMedia?: (mediaId: string) => Promise<unknown>;
	onError?: (id: string | null, message: string) => void;
	onDeleteSuccess?: (mediaId: string) => void;
	onUploadEnqueued?: () => void;
}

export function useMediaHandlers(deps: MediaHandlerDeps) {
	const {
		actions,
		triggerSync,
		enqueueUpload,
		userId,
		scopeId,
		organizationId,
		config,
		fileStorage,
		t,
		deleteMedia: deleteMediaOnServer,
		onError,
		onDeleteSuccess,
		onUploadEnqueued,
	} = deps;

	const selectFiles = useFileSelection({
		processMediaFile: actions.processMediaFile,
		userId,
		scopeType: config.scopeType,
		scopeId,
		organizationId,
		fileStorage,
		enqueueUpload,
		triggerSync,
		onError,
		t,
	});

	const deleteMedia = useMediaDeletion({
		removeMedia: actions.removeMedia,
		triggerSync,
		deleteOnServer: deleteMediaOnServer,
	});

	const retryUpload = useMediaRetry({
		retryMedia: actions.retryMedia,
		getAttachmentForMedia: actions.getAttachmentForMedia,
		enqueueUpload,
		triggerSync,
	});

	const handleFilesSelected = useCallback(
		async (files: File[], target?: MediaAttachmentTarget) => {
			try {
				await selectFiles(files, target);
				onUploadEnqueued?.();
			} catch (error) {
				onError?.(
					target?.entityId ?? null,
					isQuotaError(error) ? t("errors:storageFull") : t("upload.error"),
				);
			}
		},
		[selectFiles, onError, onUploadEnqueued, t],
	);

	const handleDelete = useCallback(
		async (mediaId: string) => {
			try {
				await deleteMedia(mediaId);
				onDeleteSuccess?.(mediaId);
			} catch (error) {
				onError?.(
					mediaId,
					isQuotaError(error) ? t("errors:storageFull") : t("upload.error"),
				);
			}
		},
		[deleteMedia, onDeleteSuccess, onError, t],
	);

	const handleRetry = useCallback(
		async (mediaId: string) => {
			try {
				await retryUpload(mediaId);
			} catch (error) {
				onError?.(
					mediaId,
					isQuotaError(error) ? t("errors:storageFull") : t("upload.error"),
				);
			}
		},
		[retryUpload, onError, t],
	);

	return useMemo(
		() => ({
			handleDelete,
			handleFilesSelected,
			handleRetry,
		}),
		[handleDelete, handleFilesSelected, handleRetry],
	);
}
