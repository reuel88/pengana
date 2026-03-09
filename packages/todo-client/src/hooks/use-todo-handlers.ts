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

export interface TodoHandlerDeps {
	triggerSync: () => void;
	enqueueUpload: (todoId: string, fileUri: string, mimeType: string) => void;
	onError: (id: string, message: string) => void;
	clearError: (id: string) => void;
	fileStorage: FileStorageStrategy;
	t: (key: string) => string;
	onDeleteSuccess?: (id: string) => void;
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
	} = deps;

	const handleToggle = useCallback(
		async (id: string) => {
			try {
				clearError(id);
				await toggleTodo(id);
				triggerSync();
			} catch {
				onError(id, t("errors:failedToToggleTodo"));
			}
		},
		[clearError, triggerSync, onError, t],
	);

	const handleDelete = useCallback(
		async (id: string) => {
			try {
				clearError(id);
				await deleteTodo(id);
				onDeleteSuccess?.(id);
				triggerSync();
			} catch {
				onError(id, t("errors:failedToDeleteTodo"));
			}
		},
		[clearError, triggerSync, onError, onDeleteSuccess, t],
	);

	const handleResolve = useCallback(
		async (id: string, resolution: "local" | "server") => {
			try {
				clearError(id);
				await resolveConflict(id, resolution);
				triggerSync();
			} catch {
				onError(id, t("errors:failedToResolveConflict"));
			}
		},
		[clearError, triggerSync, onError, t],
	);

	const handleFileSelected = useCallback(
		async (id: string, file: File) => {
			try {
				clearError(id);
				await storeFile(id, file);
				const fileRef = createFileRef(id, file);
				await attachFile(id, fileRef);
				enqueueUpload(id, fileRef, file.type);
				triggerSync();
			} catch {
				onError(id, t("errors:failedToStoreFile"));
			}
		},
		[
			clearError,
			storeFile,
			createFileRef,
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
