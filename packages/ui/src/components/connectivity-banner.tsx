import { useTranslation } from "@pengana/i18n";

import { cn } from "../lib/utils";

export function ConnectivityBanner({
	isOnline,
	isSyncing,
}: {
	isOnline: boolean;
	isSyncing: boolean;
}) {
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
			{isOnline ? (isSyncing ? t("syncing") : t("online")) : t("offline")}
		</div>
	);
}
