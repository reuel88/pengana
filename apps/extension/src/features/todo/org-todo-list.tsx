import { useTranslation } from "@pengana/i18n";
import { INDEXEDDB_URI_PREFIX } from "@pengana/sync-engine";
import type { TodoActions, WebOrgTodo } from "@pengana/todo-client";
import {
	attachOrgFile,
	deleteOrgTodo,
	resolveOrgConflict,
	toggleOrgTodo,
	useTodoListWiring,
} from "@pengana/todo-client";
import { TodoList as TodoListBase } from "@pengana/ui/components/todo-list";
import { useCallback, useState } from "react";
import { storeFileInIndexedDB } from "@/features/sync/entities/upload-queue";
import { useOrgSync } from "@/features/sync/org-sync-context";

const fileStorage = {
	storeFile: storeFileInIndexedDB,
	createFileRef: (id: string) => ({ uri: `${INDEXEDDB_URI_PREFIX}${id}` }),
};

const orgActions: TodoActions = {
	toggleTodo: toggleOrgTodo,
	deleteTodo: deleteOrgTodo,
	resolveConflict: resolveOrgConflict,
	attachFile: attachOrgFile,
};

export function OrgTodoList({ todos }: { todos: WebOrgTodo[] }) {
	const { triggerSync, enqueueUpload } = useOrgSync();
	const { t } = useTranslation();
	const [errors, setErrors] = useState<Record<string, string>>({});

	const onError = useCallback((id: string, message: string) => {
		setErrors((prev) => ({ ...prev, [id]: message }));
	}, []);

	const clearError = useCallback((id: string) => {
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
			actions: orgActions,
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
