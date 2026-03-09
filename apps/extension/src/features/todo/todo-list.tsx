import { useTranslation } from "@pengana/i18n";
import { INDEXEDDB_URI_PREFIX } from "@pengana/sync-engine";
import type { WebTodo } from "@pengana/todo-client";
import { useTodoHandlers } from "@pengana/todo-client";
import { TodoList as TodoListBase } from "@pengana/ui/components/todo-list";
import { useCallback, useMemo, useState } from "react";
import { storeFileInIndexedDB } from "@/entities/upload-queue";
import { useSync } from "@/features/sync/sync-context";

export function TodoList({ todos }: { todos: WebTodo[] }) {
	const { triggerSync, enqueueUpload } = useSync();
	const { t } = useTranslation();
	const [errors, setErrors] = useState<Record<string, string | null>>({});

	const onError = useCallback((id: string, message: string) => {
		setErrors((prev) => ({ ...prev, [id]: message }));
	}, []);

	const clearError = useCallback((id: string) => {
		setErrors((prev) => ({ ...prev, [id]: null }));
	}, []);

	const onDeleteSuccess = useCallback((id: string) => {
		setErrors((prev) => {
			const { [id]: _, ...rest } = prev;
			return rest;
		});
	}, []);

	const fileStorage = useMemo(
		() => ({
			storeFile: (id: string, file: File) => storeFileInIndexedDB(id, file),
			createFileRef: (id: string) => `${INDEXEDDB_URI_PREFIX}${id}`,
		}),
		[],
	);

	const deps = useMemo(
		() => ({
			triggerSync,
			enqueueUpload,
			onError,
			clearError,
			fileStorage,
			t,
			onDeleteSuccess,
		}),
		[
			triggerSync,
			enqueueUpload,
			onError,
			clearError,
			fileStorage,
			t,
			onDeleteSuccess,
		],
	);

	const { handleToggle, handleDelete, handleResolve, handleFileSelected } =
		useTodoHandlers(deps);

	return (
		<TodoListBase
			todos={todos}
			onToggle={handleToggle}
			onDelete={handleDelete}
			onResolve={handleResolve}
			onFileSelected={handleFileSelected}
			onValidationError={(id, msg) => onError(id, msg)}
			errors={errors}
		/>
	);
}
