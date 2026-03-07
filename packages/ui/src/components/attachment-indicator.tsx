import { useTranslation } from "@pengana/i18n";
import type { UploadStatus } from "@pengana/sync-engine";

export function AttachmentIndicator({
	status,
	attachmentUrl,
}: {
	status: UploadStatus | null;
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
