import type { EnqueueUploadParams } from "@pengana/sync/upload";
import {
	isAllowedMimeType,
	isQuotaError,
	MAX_FILE_SIZE_BYTES,
} from "@pengana/sync/upload";
import { useCallback, useMemo } from "react";
import type { MediaActions } from "./media-actions";

export type MediaHandlerResult<T = void> =
	| { success: true; data: T }
	| { success: false; error: string };

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
	t: (key: string) => string;
	actions: MediaActions;
	userId: string;
	scopeId: string;
	organizationId: string;
	scopeType: "personal" | "org";
	fileStorage: MediaFileStorageStrategy;
}

export function useMediaHandlers(deps: MediaHandlerDeps) {
	const {
		t,
		actions,
		userId,
		scopeId,
		organizationId,
		scopeType,
		fileStorage,
	} = deps;

	const handleFileSelected = useCallback(
		async (
			file: File,
			target?: MediaAttachmentTarget,
		): Promise<MediaHandlerResult<EnqueueUploadParams>> => {
			if (!isAllowedMimeType(file.type)) {
				return { success: false, error: t("dropzone.rejected.type") };
			}
			if (file.size > MAX_FILE_SIZE_BYTES) {
				return { success: false, error: t("dropzone.rejected.size") };
			}

			try {
				const result = await actions.processMediaFile({
					file,
					userId,
					scopeType,
					scopeId,
					organizationId,
					target,
					storeFile: fileStorage.storeFile,
					createFileRef: fileStorage.createFileRef,
				});
				return { success: true, data: result.enqueueParams };
			} catch (error) {
				return {
					success: false,
					error: isQuotaError(error)
						? t("errors:storageFull")
						: t("upload.error"),
				};
			}
		},
		[actions, userId, scopeType, scopeId, organizationId, fileStorage, t],
	);

	const handleDelete = useCallback(
		async (mediaId: string): Promise<MediaHandlerResult> => {
			try {
				await actions.removeMedia(mediaId);
				return { success: true, data: undefined };
			} catch (error) {
				return {
					success: false,
					error: isQuotaError(error)
						? t("errors:storageFull")
						: t("upload.error"),
				};
			}
		},
		[actions, t],
	);

	const handleRetry = useCallback(
		async (
			mediaId: string,
		): Promise<MediaHandlerResult<EnqueueUploadParams | null>> => {
			try {
				const record = await actions.retryMedia(mediaId);
				if (!record?.localUri) return { success: true, data: null };

				const attachment = await actions.getAttachmentForMedia(mediaId);

				return {
					success: true,
					data: {
						fileUri: record.localUri,
						mimeType: record.mimeType,
						mediaId: record.id,
						entityType: attachment?.entityType,
						entityId: attachment?.entityId,
						scopeType: attachment
							? undefined
							: (record.scopeType as "personal" | "org" | undefined),
					},
				};
			} catch (error) {
				return {
					success: false,
					error: isQuotaError(error)
						? t("errors:storageFull")
						: t("upload.error"),
				};
			}
		},
		[actions, t],
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
