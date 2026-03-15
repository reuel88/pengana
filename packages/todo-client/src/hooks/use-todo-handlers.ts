import type { EntityDatabase } from "@pengana/entity-store";
import { isQuotaError } from "@pengana/sync-engine";
import { useCallback, useMemo } from "react";
import {
	addMedia,
	getMediaCountForEntity,
	removeMedia,
} from "../lib/media-actions";
import { deleteTodo, resolveConflict, toggleTodo } from "../lib/todo-actions";

const MAX_ATTACHMENTS = 10;

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

function createDefaultActions(db: EntityDatabase): TodoActions {
	return {
		toggleTodo: (id) => toggleTodo(db, id),
		deleteTodo: (id) => deleteTodo(db, id),
		resolveConflict: (id, resolution) => resolveConflict(db, id, resolution),
	};
}

function resolveActions({
	actions,
	db,
}: Pick<TodoHandlerDeps, "actions" | "db">): TodoActions {
	if (actions) {
		return actions;
	}

	if (!db) {
		throw new Error("useTodoHandlers requires either actions or db");
	}

	return createDefaultActions(db);
}

export interface TodoHandlerDeps {
	triggerSync: () => void;
	enqueueUpload: (
		entityType: string,
		entityId: string,
		fileUri: string,
		mimeType: string,
		mediaId: string,
	) => void;
	entityType?: string;
	userId?: string;
	onError: (id: string, message: string) => void;
	clearError: (id: string) => void;
	fileStorage: FileStorageStrategy;
	t: (key: string) => string;
	onDeleteSuccess?: (id: string) => void;
	deleteAttachment?: (attachmentId: string) => Promise<unknown>;
	actions?: TodoActions;
	db?: EntityDatabase;
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
					const mediaId = await addMedia(
						db,
						todoId,
						entityType,
						userId,
						"",
						file.type,
					);
					await storeFile(mediaId, file);
					const fileRef = createFileRef(mediaId, file);
					refs.push(fileRef);

					await db
						.getTable("media")
						.update(mediaId, { localUri: fileRef.uri } as never);

					enqueueUpload(entityType, todoId, fileRef.uri, file.type, mediaId);
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
