import { useTranslation } from "@pengana/i18n";

import { cn } from "../lib/utils";

type SyncStatus =
	| "synced"
	| "pending"
	| "conflict"
	| "queued"
	| "uploading"
	| "uploaded"
	| "failed"
	| null;

function statusDotClass(status: SyncStatus): string {
	switch (status) {
		case "queued":
		case "uploading":
		case "pending":
			return "animate-pulse bg-yellow-500";
		case "uploaded":
		case "synced":
			return "bg-green-500";
		case "failed":
		case "conflict":
			return "bg-red-500";
		default:
			return "bg-gray-400";
	}
}

export function SyncDot({ status }: { status: SyncStatus }) {
	const { t } = useTranslation("todos");

	const labels = {
		// 2do entities
		synced: t("sync.synced"),
		pending: t("sync.pending"),
		conflict: t("sync.conflict"),

		// media entities
		queued: t("sync.queued"),
		uploading: t("sync.uploading"),
		uploaded: t("sync.uploaded"),
		failed: t("sync.failed"),
	};

	return (
		<span
			className={cn("inline-block size-2 rounded-full", statusDotClass(status))}
			title={status ? labels[status] : t("sync.unknown")}
		/>
	);
}
