import { isQuotaError } from "@pengana/sync-engine";
import { useCallback, useMemo } from "react";

import {
	attachFile,
	deleteTodo,
	resolveConflict,
	toggleTodo,
} from "../lib/todo-actions";

export interface FileStorageStrategy {
	storeFile: (id: string, file: File) => Promise<void> | void;
	createFileRef: (id: string, file: File) => string;
}

export interface TodoActions {
	toggleTodo: (id: string) => Promise<void>;
	deleteTodo: (id: string) => Promise<void>;
	resolveConflict: (
		id: string,
		resolution: "local" | "server",
	) => Promise<void>;
	attachFile: (id: string, localUri: string) => Promise<void>;
}

const defaultActions: TodoActions = {
	toggleTodo,
	deleteTodo,
	resolveConflict,
	attachFile,
};

export interface TodoHandlerDeps {
	triggerSync: () => void;
	enqueueUpload: (todoId: string, fileUri: string, mimeType: string) => void;
	onError: (id: string, message: string) => void;
	clearError: (id: string) => void;
	fileStorage: FileStorageStrategy;
	t: (key: string) => string;
	onDeleteSuccess?: (id: string) => void;
	actions?: TodoActions;
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
		actions = defaultActions,
	} = deps;

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

	const handleFileSelected = useCallback(
		async (id: string, file: File) => {
			try {
				clearError(id);
				await storeFile(id, file);
				const fileRef = createFileRef(id, file);
				await actions.attachFile(id, fileRef);
				enqueueUpload(id, fileRef, file.type);
				triggerSync();
			} catch (e) {
				onError(
					id,
					isQuotaError(e)
						? t("errors:storageFull")
						: t("errors:failedToStoreFile"),
				);
			}
		},
		[
			clearError,
			storeFile,
			createFileRef,
			actions,
			enqueueUpload,
			triggerSync,
			onError,
			t,
		],
	);

	return useMemo(
		() => ({ handleToggle, handleDelete, handleResolve, handleFileSelected }),
		[handleToggle, handleDelete, handleResolve, handleFileSelected],
	);
}
