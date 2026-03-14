import { useTranslation } from "@pengana/i18n";
import { INDEXEDDB_URI_PREFIX } from "@pengana/sync-engine";
import type { TodoActions, WebOrgTodo, WebTodo } from "@pengana/todo-client";
import { useTodoListWiring } from "@pengana/todo-client";
import { storeFileInIndexedDB } from "@pengana/todo-client/adapters/dexie-file-store";
import { TodoList as TodoListBase } from "@pengana/ui/components/todo-list";
import { useCallback, useState } from "react";
import { appDb } from "@/shared/db";

const fileStorage = {
	storeFile: (entityId: string, file: File) =>
		storeFileInIndexedDB(appDb, entityId, file),
	createFileRef: (id: string) => ({ uri: `${INDEXEDDB_URI_PREFIX}${id}` }),
};

interface TodoListProps {
	todos: WebTodo[] | WebOrgTodo[];
	syncHook: {
		triggerSync: () => void;
		enqueueUpload: (
			entityType: string,
			entityId: string,
			fileUri: string,
			mimeType: string,
		) => void;
	};
	actions?: TodoActions;
	entityType?: string;
}

export function TodoList({
	todos,
	syncHook,
	actions,
	entityType,
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

	const { handleToggle, handleDelete, handleResolve, handleFileSelected } =
		useTodoListWiring({
			triggerSync,
			enqueueUpload,
			onError,
			clearError,
			fileStorage,
			t,
			onDeleteSuccess: clearError,
			db: appDb,
			...(actions ? { actions, entityType } : {}),
		});

	return (
		<TodoListBase
			todos={todos}
			onToggle={handleToggle}
			onDelete={handleDelete}
			onResolve={handleResolve}
			onFileSelected={handleFileSelected}
			onValidationError={onError}
			errors={errors}
		/>
	);
}
