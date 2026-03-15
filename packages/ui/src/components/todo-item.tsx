import { useTranslation } from "@pengana/i18n";
import {
	isAllowedMimeType,
	MAX_FILE_SIZE_BYTES,
	type SyncStatus,
} from "@pengana/sync-engine";
import { useRef } from "react";
import { cn } from "../lib/utils";
import { type AttachmentItem, AttachmentList } from "./attachment-list";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { SyncDot } from "./sync-dot";

const MAX_ATTACHMENTS = 10;

export interface TodoItemData {
	id: string;
	title: string;
	completed: boolean;
	syncStatus: SyncStatus;
	attachments: AttachmentItem[];
}

interface TodoItemProps {
	todo: TodoItemData;
	onToggle: () => void;
	onDelete: () => void;
	onResolve: (resolution: "local" | "server") => void;
	onFilesSelected: (files: File[]) => void;
	onRemoveAttachment: (attachmentId: string) => void;
	onRetryAttachment?: (attachmentId: string) => void;
	onValidationError?: (message: string) => void;
	error?: string | null;
}

export function TodoItem({
	todo,
	onToggle,
	onDelete,
	onResolve,
	onFilesSelected,
	onRemoveAttachment,
	onRetryAttachment,
	onValidationError,
	error,
}: TodoItemProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { t } = useTranslation("todos");

	const handleAttach = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const fileList = e.target.files;
		if (!fileList || fileList.length === 0) return;

		const files = Array.from(fileList);
		e.target.value = "";

		const valid: File[] = [];
		for (const file of files) {
			if (!isAllowedMimeType(file.type)) {
				onValidationError?.(t("errors:invalidFileType"));
				continue;
			}
			if (file.size > MAX_FILE_SIZE_BYTES) {
				onValidationError?.(t("errors:fileTooLarge"));
				continue;
			}
			valid.push(file);
		}

		if (valid.length > 0) {
			onFilesSelected(valid);
		}
	};

	const canAttach = todo.attachments.length < MAX_ATTACHMENTS;

	return (
		<div
			className="flex flex-col border-border border-b last:border-b-0"
			data-testid="todo-row"
			data-completed={todo.completed}
		>
			<div className="flex items-center gap-3 px-3 py-2">
				<input
					ref={fileInputRef}
					type="file"
					accept="image/jpeg,image/png,image/heic,application/pdf"
					multiple
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
				{canAttach && (
					<Button size="xs" variant="outline" onClick={handleAttach}>
						{t("actions.attach")}
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
			<AttachmentList
				attachments={todo.attachments}
				onRemove={onRemoveAttachment}
				onRetry={onRetryAttachment}
			/>
			{error && <p className="px-3 pb-2 text-red-500 text-xs">{error}</p>}
		</div>
	);
}
