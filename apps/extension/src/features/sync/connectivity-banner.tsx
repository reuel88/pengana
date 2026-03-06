import { useTranslation } from "@pengana/i18n";
import { cn } from "@/lib/utils";
import { useSync } from "./sync-context";

function getStatusLabel(
	isOnline: boolean,
	isSyncing: boolean,
	t: (key: string) => string,
) {
	if (!isOnline) return t("offline");
	if (isSyncing) return t("syncing");
	return t("online");
}

export function ConnectivityBanner() {
	const { isOnline, isSyncing } = useSync();
	const { t } = useTranslation("sync");

	return (
		<div
			className={cn(
				"px-3 py-1.5 text-center font-medium text-xs",
				isOnline
					? "bg-green-500/10 text-green-600 dark:text-green-400"
					: "bg-red-500/10 text-red-600 dark:text-red-400",
			)}
		>
			{getStatusLabel(isOnline, isSyncing, t)}
		</div>
	);
}
