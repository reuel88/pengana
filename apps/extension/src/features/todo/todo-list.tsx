import { useTranslation } from "@pengana/i18n";
import { INDEXEDDB_URI_PREFIX } from "@pengana/sync-engine";
import type { WebTodo } from "@pengana/todo-client";
import {
	attachFile,
	deleteTodo,
	resolveConflict,
	toggleTodo,
} from "@pengana/todo-client";
import { TodoList as TodoListBase } from "@pengana/ui/components/todo-list";
import { useState } from "react";
import { storeFileForUpload } from "@/entities/upload-queue";
import { useSync } from "@/features/sync/sync-context";

export function TodoList({ todos }: { todos: WebTodo[] }) {
	const { triggerSync, enqueueUpload } = useSync();
	const { t } = useTranslation();
	const [errors, setErrors] = useState<Record<string, string | null>>({});

	const setError = (id: string, error: string | null) => {
		setErrors((prev) => ({ ...prev, [id]: error }));
	};

	const handleToggle = async (id: string) => {
		try {
			setError(id, null);
			await toggleTodo(id);
			triggerSync();
		} catch {
			setError(id, t("errors:failedToToggleTodo"));
		}
	};

	const handleDelete = async (id: string) => {
		try {
			setError(id, null);
			await deleteTodo(id);
			setErrors((prev) => {
				const { [id]: _, ...rest } = prev;
				return rest;
			});
			triggerSync();
		} catch {
			setError(id, t("errors:failedToDeleteTodo"));
		}
	};

	const handleResolve = async (id: string, resolution: "local" | "server") => {
		try {
			setError(id, null);
			await resolveConflict(id, resolution);
			triggerSync();
		} catch {
			setError(id, t("errors:failedToResolveConflict"));
		}
	};

	const handleFileSelected = async (id: string, file: File) => {
		try {
			setError(id, null);
			await storeFileForUpload(id, file);
			const fileRef = `${INDEXEDDB_URI_PREFIX}${id}`;
			await attachFile(id, fileRef);
			enqueueUpload(id, fileRef, file.type);
		} catch {
			setError(id, t("errors:failedToStoreFile"));
		}
	};

	return (
		<TodoListBase
			todos={todos}
			onToggle={handleToggle}
			onDelete={handleDelete}
			onResolve={handleResolve}
			onFileSelected={handleFileSelected}
			onValidationError={(id, msg) => setError(id, msg)}
			errors={errors}
		/>
	);
}
