import {
	type MediaActions,
	type MediaAttachmentTarget,
	useFileSelection,
	useMediaDeletion,
	useMediaRetry,
} from "@pengana/upload-client";
import type { EnqueueUploadParams } from "@pengana/upload-queue";
import { isQuotaError, MAX_ATTACHMENTS } from "@pengana/upload-queue";
import { useCallback, useMemo } from "react";

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
	triggerSync: () => void;
	enqueueUpload: (params: EnqueueUploadParams) => void;
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
	getMediaCountForEntity: (entityId: string) => Promise<number>;
}

export function useTodoHandlers(deps: TodoHandlerDeps) {
	const {
		triggerSync,
		enqueueUpload,
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
		getMediaCountForEntity,
	} = deps;

	const selectFiles = useFileSelection({
		processMediaFile: mediaActions.processMediaFile,
		userId,
		scopeType,
		scopeId,
		organizationId,
		fileStorage,
		enqueueUpload,
		triggerSync,
		onError: (id, msg) => onError(id ?? "", msg),
		t,
	});

	const deleteAttachment = useMediaDeletion({
		removeMedia: mediaActions.removeMedia,
		triggerSync,
		deleteOnServer: deleteAttachmentOnServer,
	});

	const retryUpload = useMediaRetry({
		retryMedia: mediaActions.retryMedia,
		getAttachmentForMedia: mediaActions.getAttachmentForMedia,
		enqueueUpload,
		triggerSync,
	});

	const handleToggle = useCallback(
		async (id: string) => {
			try {
				clearError(id);
				await actions.toggleTodo(id);
				triggerSync();
			} catch (e) {
				onError(
					id,
					isQuotaError(e)
						? t("errors:storageFull")
						: t("errors:failedToToggleTodo"),
				);
			}
		},
		[clearError, actions, triggerSync, onError, t],
	);

	const handleDelete = useCallback(
		async (id: string) => {
			try {
				clearError(id);
				await actions.deleteTodo(id);
				onDeleteSuccess?.(id);
				triggerSync();
			} catch (e) {
				onError(
					id,
					isQuotaError(e)
						? t("errors:storageFull")
						: t("errors:failedToDeleteTodo"),
				);
			}
		},
		[clearError, actions, triggerSync, onError, onDeleteSuccess, t],
	);

	const handleResolve = useCallback(
		async (id: string, resolution: "local" | "server") => {
			try {
				clearError(id);
				await actions.resolveConflict(id, resolution);
				triggerSync();
			} catch (e) {
				onError(
					id,
					isQuotaError(e)
						? t("errors:storageFull")
						: t("errors:failedToResolveConflict"),
				);
			}
		},
		[clearError, actions, triggerSync, onError, t],
	);

	const handleFilesSelected = useCallback(
		async (files: File[], target: MediaAttachmentTarget) => {
			try {
				clearError(target.entityId);
				const currentCount = await getMediaCountForEntity(target.entityId);
				const available = MAX_ATTACHMENTS - currentCount;
				await selectFiles(files.slice(0, available), target);
			} catch (e) {
				onError(
					target.entityId,
					isQuotaError(e)
						? t("errors:storageFull")
						: t("errors:failedToStoreFile"),
				);
			}
		},
		[clearError, selectFiles, onError, t, getMediaCountForEntity],
	);

	const handleRemoveAttachment = useCallback(
		async (todoId: string, attachmentId: string) => {
			try {
				clearError(todoId);
				await deleteAttachment(attachmentId);
			} catch {
				onError(todoId, t("errors:failedToDeleteAttachment"));
			}
		},
		[clearError, deleteAttachment, onError, t],
	);

	const handleRetry = useCallback(
		async (mediaId: string) => {
			try {
				await retryUpload(mediaId);
			} catch (error) {
				onError(
					mediaId,
					isQuotaError(error) ? t("errors:storageFull") : t("upload.error"),
				);
			}
		},
		[retryUpload, onError, t],
	);

	return useMemo(
		() => ({
			handleToggle,
			handleDelete,
			handleResolve,
			handleRemoveAttachment,
			handleFilesSelected,
			handleRetry,
		}),
		[
			handleToggle,
			handleDelete,
			handleResolve,
			handleRemoveAttachment,
			handleFilesSelected,
			handleRetry,
		],
	);
}
