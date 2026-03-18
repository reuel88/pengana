import type { EntityDatabase } from "@pengana/entity-store";
import { isQuotaError, MAX_ATTACHMENTS } from "@pengana/sync-engine";
import {
	getMediaCountForEntity,
	type MediaAttachmentTarget,
	useFileSelection,
	useMediaDeletion,
	useMediaRetry,
} from "@pengana/upload-client";
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
	enqueueUpload: (
		fileUri: string,
		mimeType: string,
		mediaId: string,
		entityType?: string,
		entityId?: string,
		scopeType?: "personal" | "org",
	) => void;
	entityType?: string;
	userId?: string;
	scopeType: "personal" | "org";
	scopeId: string;
	organizationId: string;
	onError: (id: string, message: string) => void;
	clearError: (id: string) => void;
	fileStorage: FileStorageStrategy;
	t: (key: string) => string;
	onDeleteSuccess?: (id: string) => void;
	deleteAttachment?: (attachmentId: string) => Promise<unknown>;
	onDeleteAttachmentSuccess?: (attachmentId: string) => void;
	actions: TodoActions;
	db?: EntityDatabase;
}

export function useTodoHandlers(deps: TodoHandlerDeps) {
	const {
		db,
		triggerSync,
		enqueueUpload,
		userId = "",
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
	} = deps;

	const selectFiles = useFileSelection({
		db,
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
		db,
		triggerSync,
		deleteOnServer: deleteAttachmentOnServer,
	});

	const retryUpload = useMediaRetry({
		db,
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
			if (!db) return;
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
		[clearError, actions, triggerSync, onError, onDeleteSuccess, t, db],
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
			if (!db) return;
			try {
				clearError(target.entityId);
				const currentCount = await getMediaCountForEntity(db, target.entityId);
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
		[db, clearError, selectFiles, onError, t],
	);

	const handleRemoveAttachment = useCallback(
		async (todoId: string, attachmentId: string) => {
			if (!db) return;
			try {
				clearError(todoId);
				await deleteAttachment(attachmentId);
			} catch {
				onError(todoId, t("errors:failedToDeleteAttachment"));
			}
		},
		[db, clearError, deleteAttachment, onError, t],
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
