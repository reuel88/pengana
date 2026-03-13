import { useTranslation } from "@pengana/i18n";
import { INDEXEDDB_URI_PREFIX } from "@pengana/sync-engine";
import type { WebTodo } from "@pengana/todo-client";
import { useTodoListWiring } from "@pengana/todo-client";
import { TodoList as TodoListBase } from "@pengana/ui/components/todo-list";
import { useCallback, useState } from "react";
import { storeFileInIndexedDB } from "@/features/sync/entities/upload-queue";
import { useSync } from "@/features/sync/sync-context";
import { appDb } from "@/shared/db";

const fileStorage = {
	storeFile: storeFileInIndexedDB,
	createFileRef: (id: string) => ({ uri: `${INDEXEDDB_URI_PREFIX}${id}` }),
};

export function TodoList({ todos }: { todos: WebTodo[] }) {
	const { triggerSync, enqueueUpload } = useSync();
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
