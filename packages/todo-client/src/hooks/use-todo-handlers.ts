import type { EntityDatabase } from "@pengana/entity-store";
import { isQuotaError, MAX_ATTACHMENTS } from "@pengana/sync-engine";
import {
	addMedia,
	attachMediaToEntity,
	getMediaCountForEntity,
	removeMedia,
} from "@pengana/upload-client";
import { useCallback, useMemo } from "react";
import { createTodoActions } from "../lib/todo-actions";
import type { TodoConfig } from "../lib/todo-config";
import { personalTodoConfig } from "../lib/todo-config";

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

function resolveActions({
	actions,
	db,
	config,
}: Pick<TodoHandlerDeps, "actions" | "db" | "config">): TodoActions {
	if (actions) {
		return actions;
	}

	if (!db) {
		throw new Error("useTodoHandlers requires either actions or db");
	}

	return createTodoActions(db, config ?? personalTodoConfig);
}

export interface TodoHandlerDeps {
	triggerSync: () => void;
	enqueueUpload: (
		fileUri: string,
		mimeType: string,
		mediaId: string,
		entityType?: string,
		entityId?: string,
	) => void;
	entityType?: string;
	userId?: string;
	scopeType: "personal" | "org";
	scopeId: string;
	organizationId: string | null;
	onError: (id: string, message: string) => void;
	clearError: (id: string) => void;
	fileStorage: FileStorageStrategy;
	t: (key: string) => string;
	onDeleteSuccess?: (id: string) => void;
	deleteAttachment?: (attachmentId: string) => Promise<unknown>;
	actions?: TodoActions;
	db?: EntityDatabase;
	config?: TodoConfig;
}

export function useTodoHandlers(deps: TodoHandlerDeps) {
	const {
		triggerSync,
		enqueueUpload,
		onError,
		clearError,
		fileStorage: { storeFile, createFileRef },
		t,
		onDeleteSuccess,
		entityType = "todo",
		userId = "",
		scopeType,
		scopeId,
		organizationId,
		db,
	} = deps;
	const actions = resolveActions(deps);

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

	const handleRemoveAttachment = useCallback(
		async (todoId: string, attachmentId: string) => {
			if (!db) return;
			try {
				clearError(todoId);
				await removeMedia(db, attachmentId);
				await deps.deleteAttachment?.(attachmentId);
				triggerSync();
			} catch {
				onError(todoId, t("errors:failedToDeleteAttachment"));
			}
		},
		[db, clearError, deps.deleteAttachment, triggerSync, onError, t],
	);

	const handleFilesSelected = useCallback(
		async (todoId: string, files: File[]) => {
			if (!db) return;
			const refs: Array<{ revoke?: () => void }> = [];
			try {
				clearError(todoId);
				const currentCount = await getMediaCountForEntity(db, todoId);
				const available = MAX_ATTACHMENTS - currentCount;
				const filesToProcess = files.slice(0, available);

				for (const file of filesToProcess) {
					const mediaId = await addMedia(db, {
						userId,
						localUri: "",
						mimeType: file.type,
						scopeType,
						scopeId,
						organizationId,
						createdBy: userId,
					});
					await attachMediaToEntity(db, mediaId, entityType, todoId);
					await storeFile(mediaId, file);
					const fileRef = createFileRef(mediaId, file);
					refs.push(fileRef);

					await db
						.getTable("media")
						.update(mediaId, { localUri: fileRef.uri } as never);

					enqueueUpload(fileRef.uri, file.type, mediaId, entityType, todoId);
				}
				triggerSync();
			} catch (e) {
				for (const ref of refs) ref.revoke?.();
				onError(
					todoId,
					isQuotaError(e)
						? t("errors:storageFull")
						: t("errors:failedToStoreFile"),
				);
			}
		},
		[
			db,
			clearError,
			storeFile,
			createFileRef,
			entityType,
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

	return useMemo(
		() => ({
			handleToggle,
			handleDelete,
			handleResolve,
			handleRemoveAttachment,
			handleFilesSelected,
		}),
		[
			handleToggle,
			handleDelete,
			handleResolve,
			handleRemoveAttachment,
			handleFilesSelected,
		],
	);
}
