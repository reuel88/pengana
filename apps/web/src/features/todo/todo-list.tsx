import { useTranslation } from "@pengana/i18n";
import { isAllowedMimeType, MAX_FILE_SIZE_BYTES } from "@pengana/sync-engine";
import { Button } from "@pengana/ui/components/button";
import { Checkbox } from "@pengana/ui/components/checkbox";
import { useRef } from "react";
import { toast } from "sonner";
import type { WebTodo } from "@/entities/todo/db";
import { storeFileForUpload } from "@/entities/upload-queue";
import { useSync } from "@/features/sync/sync-context";
import { cn } from "@/lib/utils";

import {
	attachFile,
	deleteTodo,
	resolveConflict,
	toggleTodo,
} from "./todo-actions";

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
	const { t } = useTranslation("todos");

	const handleToggle = async () => {
		try {
			await toggleTodo(todo.id);
			triggerSync();
		} catch {
			toast.error(t("errors:failedToToggleTodo"));
		}
	};

	const handleDelete = async () => {
		try {
			await deleteTodo(todo.id);
			triggerSync();
		} catch {
			toast.error(t("errors:failedToDeleteTodo"));
		}
	};

	const handleResolve = async (resolution: "local" | "server") => {
		try {
			await resolveConflict(todo.id, resolution);
			triggerSync();
		} catch {
			toast.error(t("errors:failedToResolveConflict"));
		}
	};

	const handleAttach = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Reset input so the same file can be re-selected
		e.target.value = "";

		if (!isAllowedMimeType(file.type)) {
			toast.error(t("errors:invalidFileType"));
			return;
		}

		if (file.size > MAX_FILE_SIZE_BYTES) {
			toast.error(t("errors:fileTooLarge"));
			return;
		}

		try {
			storeFileForUpload(todo.id, file);
			const blobUrl = URL.createObjectURL(file);
			await attachFile(todo.id, blobUrl);
			enqueueUpload(todo.id, blobUrl, file.type);
		} catch {
			toast.error(t("errors:failedToAttachFile"));
		}
	};

	return (
		<div className="flex items-center gap-3 border-border border-b px-3 py-2">
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
			{todo.syncStatus === "conflict" && (
				<div className="flex gap-1">
					<Button
						size="xs"
						variant="outline"
						onClick={() => handleResolve("local")}
					>
						{t("actions.keepLocal")}
					</Button>
					<Button
						size="xs"
						variant="outline"
						onClick={() => handleResolve("server")}
					>
						{t("actions.useServer")}
					</Button>
				</div>
			)}
			{!todo.attachmentUrl && !todo.attachmentStatus && (
				<Button size="xs" variant="outline" onClick={handleAttach}>
					{t("actions.attach")}
				</Button>
			)}
			{todo.attachmentStatus === "failed" && (
				<Button size="xs" variant="outline" onClick={handleAttach}>
					{t("actions.retry")}
				</Button>
			)}
			<Button size="xs" variant="ghost" onClick={handleDelete}>
				{t("actions.delete")}
			</Button>
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
