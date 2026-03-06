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
	const colors = {
		synced: "bg-green-500",
		pending: "bg-yellow-500",
		conflict: "bg-red-500",
	};

	const labels = {
		synced: "Synced",
		pending: "Pending sync",
		conflict: "Conflict",
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
	if (attachmentUrl && (!status || status === "uploaded")) {
		return (
			<span className="text-green-500 text-xs" title="File attached">
				attached
			</span>
		);
	}
	if (status === "queued" || status === "uploading") {
		return (
			<span className="animate-pulse text-muted-foreground text-xs">
				uploading...
			</span>
		);
	}
	if (status === "failed") {
		return <span className="text-red-500 text-xs">failed</span>;
	}
	return null;
}

function TodoItem({ todo }: { todo: WebTodo }) {
	const { triggerSync, enqueueUpload } = useSync();
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleToggle = async () => {
		try {
			await toggleTodo(todo.id);
			triggerSync();
		} catch {
			toast.error("Failed to toggle todo");
		}
	};

	const handleDelete = async () => {
		try {
			await deleteTodo(todo.id);
			triggerSync();
		} catch {
			toast.error("Failed to delete todo");
		}
	};

	const handleResolve = async (resolution: "local" | "server") => {
		try {
			await resolveConflict(todo.id, resolution);
			triggerSync();
		} catch {
			toast.error("Failed to resolve conflict");
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
			toast.error("Only JPEG, PNG, HEIC images and PDFs are allowed.");
			return;
		}

		if (file.size > MAX_FILE_SIZE_BYTES) {
			toast.error("File exceeds maximum size of 10MB.");
			return;
		}

		try {
			storeFileForUpload(todo.id, file);
			const blobUrl = URL.createObjectURL(file);
			await attachFile(todo.id, blobUrl);
			enqueueUpload(todo.id, blobUrl, file.type);
		} catch {
			toast.error("Failed to attach file");
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
						Keep Local
					</Button>
					<Button
						size="xs"
						variant="outline"
						onClick={() => handleResolve("server")}
					>
						Use Server
					</Button>
				</div>
			)}
			{!todo.attachmentUrl && !todo.attachmentStatus && (
				<Button size="xs" variant="outline" onClick={handleAttach}>
					Attach
				</Button>
			)}
			{todo.attachmentStatus === "failed" && (
				<Button size="xs" variant="outline" onClick={handleAttach}>
					Retry
				</Button>
			)}
			<Button size="xs" variant="ghost" onClick={handleDelete}>
				Delete
			</Button>
		</div>
	);
}

export function TodoList({ todos }: { todos: WebTodo[] }) {
	if (todos.length === 0) {
		return (
			<p className="py-4 text-center text-muted-foreground text-sm">
				No todos yet
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
