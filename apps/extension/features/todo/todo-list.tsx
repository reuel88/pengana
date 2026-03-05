import { isAllowedMimeType, MAX_FILE_SIZE_BYTES } from "@pengana/sync-engine";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

const INDEXEDDB_URI_PREFIX = "indexeddb://";

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
	const [fileError, setFileError] = useState<string | null>(null);

	const handleToggle = async () => {
		try {
			await toggleTodo(todo.id);
			triggerSync();
		} catch (err) {
			console.error("Failed to toggle todo", err);
		}
	};

	const handleDelete = async () => {
		try {
			await deleteTodo(todo.id);
			triggerSync();
		} catch (err) {
			console.error("Failed to delete todo", err);
		}
	};

	const handleResolve = async (resolution: "local" | "server") => {
		try {
			await resolveConflict(todo.id, resolution);
			triggerSync();
		} catch (err) {
			console.error("Failed to resolve conflict", err);
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

		if (!isAllowedMimeType(file.type)) {
			setFileError("Only JPEG, PNG, HEIC images and PDFs are allowed.");
			return;
		}

		if (file.size > MAX_FILE_SIZE_BYTES) {
			setFileError("File exceeds maximum size of 10MB.");
			return;
		}

		try {
			await storeFileForUpload(todo.id, file);
			const fileRef = `${INDEXEDDB_URI_PREFIX}${todo.id}`;
			await attachFile(todo.id, fileRef);
			enqueueUpload(todo.id, fileRef, file.type);
		} catch {
			setFileError("Failed to store file. Storage may be full.");
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
			{fileError && (
				<p className="px-3 pb-2 text-red-500 text-xs">{fileError}</p>
			)}
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
