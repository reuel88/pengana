import { useTranslation } from "@pengana/i18n";
import {
	isAllowedMimeType,
	MAX_FILE_SIZE_BYTES,
	type SyncStatus,
	type UploadStatus,
} from "@pengana/sync-engine";
import { useRef } from "react";
import { cn } from "../lib/utils";
import { AttachmentIndicator } from "./attachment-indicator";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { SyncDot } from "./sync-dot";

export interface TodoItemData {
	id: string;
	title: string;
	completed: boolean;
	syncStatus: SyncStatus;
	attachmentUrl: string | null;
	attachmentStatus: UploadStatus | null;
}

interface TodoItemProps {
	todo: TodoItemData;
	onToggle: () => void;
	onDelete: () => void;
	onResolve: (resolution: "local" | "server") => void;
	onFileSelected: (file: File) => void;
	onValidationError?: (message: string) => void;
	error?: string | null;
}

export function TodoItem({
	todo,
	onToggle,
	onDelete,
	onResolve,
	onFileSelected,
	onValidationError,
	error,
}: TodoItemProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { t } = useTranslation("todos");

	const handleAttach = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		e.target.value = "";

		if (!isAllowedMimeType(file.type)) {
			onValidationError?.(t("errors:invalidFileType"));
			return;
		}

		if (file.size > MAX_FILE_SIZE_BYTES) {
			onValidationError?.(t("errors:fileTooLarge"));
			return;
		}

		onFileSelected(file);
	};

	return (
		<div
			className="flex flex-col border-border border-b"
			data-testid="todo-row"
			data-completed={todo.completed}
		>
			<div className="flex items-center gap-3 px-3 py-2">
				<input
					ref={fileInputRef}
					type="file"
					accept="image/jpeg,image/png,image/heic,application/pdf"
					className="hidden"
					onChange={handleFileChange}
				/>
				<SyncDot status={todo.syncStatus} />
				<Checkbox
					checked={todo.completed}
					onCheckedChange={onToggle}
					data-testid="todo-toggle"
				/>
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
							onClick={() => onResolve("local")}
						>
							{t("actions.keepLocal")}
						</Button>
						<Button
							size="xs"
							variant="outline"
							onClick={() => onResolve("server")}
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
				<Button
					size="xs"
					variant="ghost"
					onClick={onDelete}
					data-testid="todo-delete"
				>
					{t("actions.delete")}
				</Button>
			</div>
			{error && <p className="px-3 pb-2 text-red-500 text-xs">{error}</p>}
		</div>
	);
}
