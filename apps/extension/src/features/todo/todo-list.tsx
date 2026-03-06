import { useTranslation } from "@pengana/i18n";
import {
	INDEXEDDB_URI_PREFIX,
	isAllowedMimeType,
	MAX_FILE_SIZE_BYTES,
} from "@pengana/sync-engine";
import { Button } from "@pengana/ui/components/button";
import { Checkbox } from "@pengana/ui/components/checkbox";
import { useRef, useState } from "react";
import type { WebTodo } from "@/entities/todo";
import { storeFileForUpload } from "@/entities/upload-queue";
import { useSync } from "@/features/sync/sync-context";
import { cn } from "@/lib/utils";

import {
	attachFile,
	deleteTodo,
	resolveConflict,
	toggleTodo,
} from "./todo-actions";

function validateFile(file: File, t: (key: string) => string): string | null {
	if (!isAllowedMimeType(file.type)) return t("errors:invalidFileType");
	if (file.size > MAX_FILE_SIZE_BYTES) return t("errors:fileTooLarge");
	return null;
}

function TodoItemActions({
	todo,
	onResolve,
	onAttach,
	onDelete,
}: {
	todo: WebTodo;
	onResolve: (resolution: "local" | "server") => void;
	onAttach: () => void;
	onDelete: () => void;
}) {
	const { t } = useTranslation();

	return (
		<>
			{todo.syncStatus === "conflict" && (
				<div className="flex gap-1">
					<Button
						size="xs"
						variant="outline"
						onClick={() => onResolve("local")}
					>
						{t("todos:actions.keepLocal")}
					</Button>
					<Button
						size="xs"
						variant="outline"
						onClick={() => onResolve("server")}
					>
						{t("todos:actions.useServer")}
					</Button>
				</div>
			)}
			{!todo.attachmentUrl && !todo.attachmentStatus && (
				<Button size="xs" variant="outline" onClick={onAttach}>
					{t("todos:actions.attach")}
				</Button>
			)}
			{todo.attachmentStatus === "failed" && (
				<Button size="xs" variant="outline" onClick={onAttach}>
					{t("todos:actions.retry")}
				</Button>
			)}
			<Button size="xs" variant="ghost" onClick={onDelete}>
				{t("todos:actions.delete")}
			</Button>
		</>
	);
}

// SyncDot and AttachmentIndicator are intentionally duplicated across web and extension.
// They're ~20 lines each, tightly coupled to each app's cn() utility and Tailwind config.
function SyncDot({ status }: { status: WebTodo["syncStatus"] }) {
	const { t } = useTranslation("todos");

	const colors = {
		synced: "bg-green-500",
		pending: "bg-yellow-500",
		conflict: "bg-red-500",
	};

	const labels = {
		synced: t("sync.synced"),
		pending: t("sync.pending"),
		conflict: t("sync.conflict"),
	};

	return (
		<span
			className={cn("inline-block size-2 rounded-full", colors[status])}
			title={labels[status]}
		/>
	);
}

function AttachmentIndicator({
	status,
	attachmentUrl,
}: {
	status: WebTodo["attachmentStatus"];
	attachmentUrl: string | null;
}) {
	const { t } = useTranslation("todos");

	if (attachmentUrl && (!status || status === "uploaded")) {
		return (
			<span
				className="text-green-500 text-xs"
				title={t("attachment.fileAttached")}
			>
				{t("attachment.attached")}
			</span>
		);
	}
	if (status === "queued" || status === "uploading") {
		return (
			<span className="animate-pulse text-muted-foreground text-xs">
				{t("attachment.uploading")}
			</span>
		);
	}
	if (status === "failed") {
		return (
			<span className="text-red-500 text-xs">{t("attachment.failed")}</span>
		);
	}
	return null;
}

function TodoItem({ todo }: { todo: WebTodo }) {
	const { triggerSync, enqueueUpload } = useSync();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [fileError, setFileError] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const { t } = useTranslation();

	const handleToggle = async () => {
		try {
			setActionError(null);
			await toggleTodo(todo.id);
			triggerSync();
		} catch {
			setActionError(t("errors:failedToToggleTodo"));
		}
	};

	const handleDelete = async () => {
		try {
			setActionError(null);
			await deleteTodo(todo.id);
			triggerSync();
		} catch {
			setActionError(t("errors:failedToDeleteTodo"));
		}
	};

	const handleResolve = async (resolution: "local" | "server") => {
		try {
			setActionError(null);
			await resolveConflict(todo.id, resolution);
			triggerSync();
		} catch {
			setActionError(t("errors:failedToResolveConflict"));
		}
	};

	const handleAttach = () => {
		setFileError(null);
		fileInputRef.current?.click();
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		e.target.value = "";
		setFileError(null);

		const validationError = validateFile(file, t);
		if (validationError) {
			setFileError(validationError);
			return;
		}

		try {
			await storeFileForUpload(todo.id, file);
			const fileRef = `${INDEXEDDB_URI_PREFIX}${todo.id}`;
			await attachFile(todo.id, fileRef);
			enqueueUpload(todo.id, fileRef, file.type);
		} catch {
			setFileError(t("errors:failedToStoreFile"));
		}
	};

	return (
		<div className="flex flex-col border-border border-b">
			<div className="flex items-center gap-3 px-3 py-2">
				<input
					ref={fileInputRef}
					type="file"
					accept="image/jpeg,image/png,image/heic,.pdf"
					className="hidden"
					onChange={handleFileChange}
				/>
				<SyncDot status={todo.syncStatus} />
				<Checkbox checked={todo.completed} onCheckedChange={handleToggle} />
				<span
					className={cn(
						"flex-1 text-sm",
						todo.completed && "text-muted-foreground line-through",
					)}
				>
					{todo.title}
				</span>
				<AttachmentIndicator
					status={todo.attachmentStatus}
					attachmentUrl={todo.attachmentUrl}
				/>
				<TodoItemActions
					todo={todo}
					onResolve={handleResolve}
					onAttach={handleAttach}
					onDelete={handleDelete}
				/>
			</div>
			{(fileError || actionError) && (
				<p className="px-3 pb-2 text-red-500 text-xs">
					{fileError ?? actionError}
				</p>
			)}
		</div>
	);
}

export function TodoList({ todos }: { todos: WebTodo[] }) {
	const { t } = useTranslation("todos");

	if (todos.length === 0) {
		return (
			<p className="py-4 text-center text-muted-foreground text-sm">
				{t("empty")}
			</p>
		);
	}

	return (
		<div className="rounded-none border border-border">
			{todos.map((todo) => (
				<TodoItem key={todo.id} todo={todo} />
			))}
		</div>
	);
}
