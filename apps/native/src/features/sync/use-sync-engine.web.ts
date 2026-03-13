import {
	type SyncEnginePlatformDeps,
	useNetworkStatus,
	useSyncEngineCore,
} from "@pengana/sync-engine";
import { useEffect, useState } from "react";

function useDocumentVisible() {
	const [isVisible, setIsVisible] = useState(
		document.visibilityState === "visible",
	);

	useEffect(() => {
		const handleVisibilityChange = () => {
			setIsVisible(document.visibilityState === "visible");
		};
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () =>
			document.removeEventListener("visibilitychange", handleVisibilityChange);
	}, []);

	return isVisible;
}

export function useSyncEngine(
	scopeId: string | undefined,
	deps: SyncEnginePlatformDeps,
	notifyKey?: string,
) {
	const { isOnline } = useNetworkStatus();
	const isForeground = useDocumentVisible();

	return useSyncEngineCore({
		scopeId,
		isOnline,
		deps,
		isForeground,
		notifyKey,
	});
}
