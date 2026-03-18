import { useTranslation } from "@pengana/i18n";
import { INDEXEDDB_URI_PREFIX } from "@pengana/sync-engine";
import {
	type TodoActions,
	useTodoHandlers,
	type WebTodo,
} from "@pengana/todo-client";
import { TodoList as TodoListBase } from "@pengana/ui/components/todo-list";
import type { LocalMedia } from "@pengana/upload-client";
import { storeFileInIndexedDB } from "@pengana/upload-client/adapters/dexie-file-store";
import { useCallback, useMemo, useState } from "react";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";

type TodoWithAttachments = WebTodo & {
	attachments: LocalMedia[];
};

interface TodoListProps {
	todos: TodoWithAttachments[];
	syncHook: {
		triggerSync: () => void;
		enqueueUpload: (
			fileUri: string,
			mimeType: string,
			mediaId: string,
			entityType?: string,
			entityId?: string,
			scopeType?: "personal" | "org",
		) => void;
	};
	actions: TodoActions;
	entityType?: string;
	userId?: string;
	scopeType: "personal" | "org";
	scopeId: string;
	organizationId: string;
}

export function TodoList({
	todos,
	syncHook,
	actions,
	entityType,
	userId,
	scopeType,
	scopeId,
	organizationId,
}: TodoListProps) {
	const { t } = useTranslation();

	const [errors, setErrors] = useState<Record<string, string>>({});

	const onError = useCallback((id: string, message: string) => {
		setErrors((prev) => ({ ...prev, [id]: message }));
	}, []);

	const clearError = useCallback((id: string) => {
		// Destructure to omit the key matching `id`, keeping the rest
		setErrors(({ [id]: _, ...rest }) => rest);
	}, []);

	const fileStorage = useMemo(
		() => ({
			storeFile: (entityId: string, file: File) =>
				storeFileInIndexedDB(appDb, entityId, file),
			createFileRef: (id: string) => ({
				uri: `${INDEXEDDB_URI_PREFIX}${id}`,
			}),
		}),
		[],
	);

	const {
		handleToggle,
		handleDelete,
		handleResolve,
		handleRemoveAttachment,
		handleFilesSelected,
	} = useTodoHandlers({
		triggerSync: syncHook.triggerSync,
		enqueueUpload: syncHook.enqueueUpload,
		onError,
		clearError,
		fileStorage,
		t,
		onDeleteSuccess: clearError,
		deleteAttachment: (attachmentId) =>
			client.upload.deleteMedia({ mediaId: attachmentId }), // Delete attachment is a direct API call
		db: appDb,
		userId,
		scopeType,
		scopeId,
		organizationId,
		entityType,
		actions,
	});

	return (
		<TodoListBase
			todos={todos}
			onToggle={handleToggle}
			onDelete={handleDelete}
			onResolve={handleResolve}
			onFilesSelected={handleFilesSelected}
			onRemoveAttachment={handleRemoveAttachment}
			onValidationError={onError}
			errors={errors}
		/>
	);
}
