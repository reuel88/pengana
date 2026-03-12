import { useTranslation } from "@pengana/i18n";
import { isQuotaError } from "@pengana/sync-engine";
import type { WebOrgTodo } from "@pengana/todo-client";
import {
	attachOrgFile,
	deleteOrgTodo,
	resolveOrgConflict,
	toggleOrgTodo,
} from "@pengana/todo-client";
import { TodoList as TodoListBase } from "@pengana/ui/components/todo-list";
import { useCallback } from "react";
import { toast } from "sonner";
import { storeFileInMemory } from "@/entities/upload-queue";
import { useOrgSync } from "@/features/sync/org-sync-context";

export function OrgTodoList({ todos }: { todos: WebOrgTodo[] }) {
	const { triggerSync, enqueueUpload } = useOrgSync();
	const { t } = useTranslation();

	const onError = useCallback((_id: string, msg: string) => {
		toast.error(msg);
	}, []);

	const handleToggle = useCallback(
		async (id: string) => {
			try {
				await toggleOrgTodo(id);
				triggerSync();
			} catch {
				onError(id, t("errors:failedToToggleTodo"));
			}
		},
		[triggerSync, onError, t],
	);

	const handleDelete = useCallback(
		async (id: string) => {
			try {
				await deleteOrgTodo(id);
				triggerSync();
			} catch {
				onError(id, t("errors:failedToDeleteTodo"));
			}
		},
		[triggerSync, onError, t],
	);

	const handleResolve = useCallback(
		async (id: string, resolution: "local" | "server") => {
			try {
				await resolveOrgConflict(id, resolution);
				triggerSync();
			} catch {
				onError(id, t("errors:failedToResolveTodo"));
			}
		},
		[triggerSync, onError, t],
	);

	const handleFileSelected = useCallback(
		async (id: string, file: File) => {
			try {
				storeFileInMemory(id, file);
				const fileRef = URL.createObjectURL(file);
				await attachOrgFile(id, fileRef);
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
		[enqueueUpload, triggerSync, onError, t],
	);

	return (
		<TodoListBase
			todos={todos}
			onToggle={handleToggle}
			onDelete={handleDelete}
			onResolve={handleResolve}
			onFileSelected={handleFileSelected}
			onValidationError={(_id, msg) => toast.error(msg)}
		/>
	);
}
