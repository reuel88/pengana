import { useSync } from "./sync-context";

export function ConnectivityBanner() {
	const { isOnline, isSyncing } = useSync();

	return (
		<div
			className={`px-3 py-1.5 text-center font-medium text-xs ${
				isOnline
					? "bg-green-500/10 text-green-600 dark:text-green-400"
					: "bg-red-500/10 text-red-600 dark:text-red-400"
			}`}
		>
			{isOnline
				? isSyncing
					? "Syncing..."
					: "Online"
				: "Offline - changes saved locally"}
		</div>
	);
}
