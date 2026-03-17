import { useTranslation } from "@pengana/i18n";
import { INDEXEDDB_URI_PREFIX } from "@pengana/sync-engine";
import type { TodoActions, TodoConfig, WebTodo } from "@pengana/todo-client";
import { useTodoListWiring } from "@pengana/todo-client";
import { TodoList as TodoListBase } from "@pengana/ui/components/todo-list";
import type { LocalMedia } from "@pengana/upload-client";
import { storeFileInIndexedDB } from "@pengana/upload-client/adapters/dexie-file-store";
import { useCallback, useState } from "react";
import { client } from "@/shared/api/orpc";
import { appDb } from "@/shared/db";

const fileStorage = {
	storeFile: (entityId: string, file: File) =>
		storeFileInIndexedDB(appDb, entityId, file),
	createFileRef: (id: string) => ({ uri: `${INDEXEDDB_URI_PREFIX}${id}` }),
};

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
		) => void;
	};
	actions?: TodoActions;
	entityType?: string;
	userId?: string;
	config?: TodoConfig;
	scopeType: "personal" | "org";
	scopeId: string;
	organizationId: string | null;
}

export function TodoList({
	todos,
	syncHook,
	actions,
	entityType,
	userId,
	config,
	scopeType,
	scopeId,
	organizationId,
}: TodoListProps) {
	const { triggerSync, enqueueUpload } = syncHook;
	const { t } = useTranslation();
	const [errors, setErrors] = useState<Record<string, string>>({});

	const onError = useCallback((id: string, message: string) => {
		setErrors((prev) => ({ ...prev, [id]: message }));
	}, []);

	const clearError = useCallback((id: string) => {
		// Destructure to omit the key matching `id`, keeping the rest
		setErrors(({ [id]: _, ...rest }) => rest);
	}, []);

	const {
		handleToggle,
		handleDelete,
		handleResolve,
		handleRemoveAttachment,
		handleFilesSelected,
	} = useTodoListWiring({
		triggerSync,
		enqueueUpload,
		onError,
		clearError,
		fileStorage,
		t,
		onDeleteSuccess: clearError,
		deleteAttachment: (attachmentId) =>
			client.upload.deleteMedia({ mediaId: attachmentId }),
		db: appDb,
		userId,
		config,
		scopeType,
		scopeId,
		organizationId,
		...(actions ? { actions, entityType } : {}),
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
