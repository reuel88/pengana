import { useTranslation } from "@pengana/i18n";
import type { UploadStatus } from "@pengana/sync-engine";
import { cn } from "../lib/utils";

export interface AttachmentItem {
	id: string;
	url: string | null;
	status: UploadStatus | null;
	mimeType: string;
}

interface AttachmentListProps {
	attachments: AttachmentItem[];
	onRemove: (attachmentId: string) => void;
	onRetry?: (attachmentId: string) => void;
}

function mimeLabel(mimeType: string): string {
	if (mimeType.startsWith("image/")) return "IMG";
	if (mimeType === "application/pdf") return "PDF";
	return "FILE";
}

function statusColor(status: UploadStatus | null, hasUrl: boolean): string {
	if (hasUrl && (!status || status === "uploaded"))
		return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
	if (status === "queued" || status === "uploading")
		return "bg-muted text-muted-foreground animate-pulse";
	if (status === "failed")
		return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
	return "bg-muted text-muted-foreground";
}

export function AttachmentList({
	attachments,
	onRemove,
	onRetry,
}: AttachmentListProps) {
	const { t } = useTranslation("todos");

	if (attachments.length === 0) return null;

	return (
		<div className="flex flex-wrap gap-1.5 px-3 pb-2">
			{attachments.map((a) => (
				<span
					key={a.id}
					className={cn(
						"inline-flex items-center gap-1 rounded-sm border border-border px-2 py-0.5 text-xs",
						statusColor(a.status, !!a.url),
					)}
				>
					<span>{mimeLabel(a.mimeType)}</span>
					{a.status === "failed" && onRetry && (
						<button
							type="button"
							className="font-medium underline"
							onClick={() => onRetry(a.id)}
						>
							{t("actions.retry")}
						</button>
					)}
					<button
						type="button"
						className="ml-0.5 opacity-60 hover:opacity-100"
						onClick={() => onRemove(a.id)}
						aria-label={t("actions.removeAttachment")}
					>
						&times;
					</button>
				</span>
			))}
		</div>
	);
}
