import type { EnqueueUploadParams } from "@pengana/sync/upload";
import {
	isAllowedMimeType,
	isQuotaError,
	MAX_FILE_SIZE_BYTES,
} from "@pengana/sync/upload";
import { useCallback, useMemo } from "react";
import type { MediaActions, MediaAttachmentTarget } from "../media";

export interface FileStorageStrategy {
	storeFile: (id: string, file: File) => Promise<void> | void;
	createFileRef: (
		id: string,
		file: File,
	) => { uri: string; revoke?: () => void };
}

export interface TodoActions {
	toggleTodo: (id: string) => Promise<void>;
	deleteTodo: (id: string) => Promise<void>;
	resolveConflict: (
		id: string,
		resolution: "local" | "server",
	) => Promise<void>;
}

export interface TodoHandlerDeps {
	entityType?: string;
	userId: string;
	scopeType: "personal" | "org";
	scopeId: string;
	organizationId: string;
	onError: (id: string, message: string) => void;
	clearError: (id: string) => void;
	fileStorage: FileStorageStrategy;
	t: (key: string) => string;
	onDeleteSuccess?: (id: string) => void;
	deleteAttachment?: (attachmentId: string) => Promise<unknown>;
	actions: TodoActions;
	mediaActions: MediaActions;
}

export function useTodoHandlers(deps: TodoHandlerDeps) {
	const {
		userId,
		scopeId,
		organizationId,
		fileStorage,
		t,
		deleteAttachment: deleteAttachmentOnServer,
		onError,
		clearError,
		onDeleteSuccess,
		scopeType,
		actions,
		mediaActions,
	} = deps;

	const handleToggle = useCallback(
		async (id: string) => {
			try {
				clearError(id);
				await actions.toggleTodo(id);
			} catch (e) {
				onError(
					id,
					isQuotaError(e)
						? t("errors:storageFull")
						: t("errors:failedToToggleTodo"),
				);
			}
		},
		[clearError, actions, onError, t],
	);

	const handleDelete = useCallback(
		async (id: string) => {
			try {
				clearError(id);
				await actions.deleteTodo(id);
				onDeleteSuccess?.(id);
			} catch (e) {
				onError(
					id,
					isQuotaError(e)
						? t("errors:storageFull")
						: t("errors:failedToDeleteTodo"),
				);
			}
		},
		[clearError, actions, onError, onDeleteSuccess, t],
	);

	const handleResolve = useCallback(
		async (id: string, resolution: "local" | "server") => {
			try {
				clearError(id);
				await actions.resolveConflict(id, resolution);
			} catch (e) {
				onError(
					id,
					isQuotaError(e)
						? t("errors:storageFull")
						: t("errors:failedToResolveConflict"),
				);
			}
		},
		[clearError, actions, onError, t],
	);

	const handleFileSelected = useCallback(
		async (
			file: File,
			target: MediaAttachmentTarget,
		): Promise<EnqueueUploadParams | null> => {
			if (!isAllowedMimeType(file.type)) {
				onError(target.entityId, t("dropzone.rejected.type"));
				return null;
			}
			if (file.size > MAX_FILE_SIZE_BYTES) {
				onError(target.entityId, t("dropzone.rejected.size"));
				return null;
			}
			try {
				clearError(target.entityId);
				const result = await mediaActions.processMediaFile({
					file,
					userId,
					scopeType,
					scopeId,
					organizationId,
					target,
					storeFile: fileStorage.storeFile,
					createFileRef: fileStorage.createFileRef,
				});
				return result.enqueueParams;
			} catch (e) {
				onError(
					target.entityId,
					isQuotaError(e)
						? t("errors:storageFull")
						: t("errors:failedToStoreFile"),
				);
				return null;
			}
		},
		[
			clearError,
			mediaActions,
			userId,
			scopeType,
			scopeId,
			organizationId,
			fileStorage,
			onError,
			t,
		],
	);

	const handleRemoveAttachment = useCallback(
		async (todoId: string, attachmentId: string) => {
			try {
				clearError(todoId);
				await mediaActions.removeMedia(attachmentId);
				await deleteAttachmentOnServer?.(attachmentId);
			} catch {
				onError(todoId, t("errors:failedToDeleteAttachment"));
			}
		},
		[clearError, mediaActions, deleteAttachmentOnServer, onError, t],
	);

	const handleRetry = useCallback(
		async (mediaId: string): Promise<EnqueueUploadParams | null> => {
			try {
				const record = await mediaActions.retryMedia(mediaId);
				if (!record?.localUri) return null;

				const attachment = await mediaActions.getAttachmentForMedia(mediaId);

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
				onError(
					mediaId,
					isQuotaError(error) ? t("errors:storageFull") : t("upload.error"),
				);
				return null;
			}
		},
		[mediaActions, onError, t],
	);

	return useMemo(
		() => ({
			handleToggle,
			handleDelete,
			handleResolve,
			handleRemoveAttachment,
			handleFileSelected,
			handleRetry,
		}),
		[
			handleToggle,
			handleDelete,
			handleResolve,
			handleRemoveAttachment,
			handleFileSelected,
			handleRetry,
		],
	);
}
