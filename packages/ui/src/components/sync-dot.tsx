import { useTranslation } from "@pengana/i18n";

import { cn } from "../lib/utils";

export function SyncDot({
	status,
}: {
	status: "synced" | "pending" | "conflict";
}) {
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
