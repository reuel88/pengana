import type { EnqueueUploadParams } from "@pengana/sync/upload";
import {
	isAllowedMimeType,
	isQuotaError,
	MAX_FILE_SIZE_BYTES,
} from "@pengana/sync/upload";
import { useCallback, useMemo } from "react";
import type { MediaActions, MediaAttachmentTarget } from "../media";

export type TodoHandlerResult<T = void> =
	| { success: true; data: T }
	| { success: false; error: string };

export interface FileStorageStrategy {
	storeFile: (id: string, file: File) => Promise<void> | void;
	createFileRef: (
		id: string,
		file: File,
	) => { uri: string; revoke?: () => void };
}

export interface TodoActions {
	addTodo: (params: {
		title: string;
		userId: string;
		scopeId: string;
		organizationId: string;
		scopeType: "personal" | "org";
	}) => Promise<void>;
	toggleTodo: (id: string) => Promise<void>;
	deleteTodo: (id: string) => Promise<void>;
	resolveConflict: (
		id: string,
		resolution: "local" | "server",
	) => Promise<void>;
}

export interface TodoHandlerDeps {
	t: (key: string) => string;
	actions: TodoActions;
	mediaActions: MediaActions;
	userId: string;
	scopeId: string;
	organizationId: string;
	scopeType: "personal" | "org";
	fileStorage: FileStorageStrategy;
}

export function useTodoHandlers(deps: TodoHandlerDeps) {
	const {
		t,
		actions,
		mediaActions,
		userId,
		scopeId,
		organizationId,
		scopeType,
		fileStorage,
	} = deps;

	const handleAdd = useCallback(
		async (title: string): Promise<TodoHandlerResult> => {
			try {
				await actions.addTodo({
					title,
					userId,
					scopeId,
					organizationId,
					scopeType,
				});
				return { success: true, data: undefined };
			} catch (e) {
				return {
					success: false,
					error: isQuotaError(e)
						? t("errors:storageFull")
						: t("errors:failedToAddTodo"),
				};
			}
		},
		[actions, t, scopeId, userId, organizationId, scopeType],
	);

	const handleToggle = useCallback(
		async (id: string): Promise<TodoHandlerResult> => {
			try {
				await actions.toggleTodo(id);
				return { success: true, data: undefined };
			} catch (e) {
				return {
					success: false,
					error: isQuotaError(e)
						? t("errors:storageFull")
						: t("errors:failedToToggleTodo"),
				};
			}
		},
		[actions, t],
	);

	const handleDelete = useCallback(
		async (todoId: string): Promise<TodoHandlerResult> => {
			try {
				await actions.deleteTodo(todoId);
				return { success: true, data: undefined };
			} catch (e) {
				return {
					success: false,
					error: isQuotaError(e)
						? t("errors:storageFull")
						: t("errors:failedToDeleteTodo"),
				};
			}
		},
		[actions, t],
	);

	const handleResolve = useCallback(
		async (
			todoId: string,
			resolution: "local" | "server",
		): Promise<TodoHandlerResult> => {
			try {
				await actions.resolveConflict(todoId, resolution);
				return { success: true, data: undefined };
			} catch (e) {
				return {
					success: false,
					error: isQuotaError(e)
						? t("errors:storageFull")
						: t("errors:failedToResolveConflict"),
				};
			}
		},
		[actions, t],
	);

	const handleFileSelected = useCallback(
		async (
			file: File,
			target: MediaAttachmentTarget,
		): Promise<TodoHandlerResult<EnqueueUploadParams>> => {
			if (!isAllowedMimeType(file.type)) {
				return { success: false, error: t("dropzone.rejected.type") };
			}
			if (file.size > MAX_FILE_SIZE_BYTES) {
				return { success: false, error: t("dropzone.rejected.size") };
			}
			try {
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
				return { success: true, data: result.enqueueParams };
			} catch (e) {
				return {
					success: false,
					error: isQuotaError(e)
						? t("errors:storageFull")
						: t("errors:failedToStoreFile"),
				};
			}
		},
		[mediaActions, userId, scopeType, scopeId, organizationId, fileStorage, t],
	);

	const handleRemoveAttachment = useCallback(
		async (
			_todoId: string,
			attachmentId: string,
		): Promise<TodoHandlerResult> => {
			try {
				await mediaActions.removeMedia(attachmentId);
				return { success: true, data: undefined };
			} catch {
				return { success: false, error: t("errors:failedToDeleteAttachment") };
			}
		},
		[mediaActions, t],
	);

	const handleRetryAttachment = useCallback(
		async (
			mediaId: string,
		): Promise<TodoHandlerResult<EnqueueUploadParams | null>> => {
			try {
				const record = await mediaActions.retryMedia(mediaId);
				if (!record?.localUri) return { success: true, data: null };

				const attachment = await mediaActions.getAttachmentForMedia(mediaId);

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
		[mediaActions, t],
	);

	return useMemo(
		() => ({
			handleAdd,
			handleToggle,
			handleDelete,
			handleResolve,
			handleRemoveAttachment,
			handleFileSelected,
			handleRetryAttachment,
		}),
		[
			handleAdd,
			handleToggle,
			handleDelete,
			handleResolve,
			handleRemoveAttachment,
			handleFileSelected,
			handleRetryAttachment,
		],
	);
}
