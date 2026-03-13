import { useEffect, useRef } from "react";
import type { SyncScope } from "@/shared/api/background-messages";

/**
 * Connects a port to the background service worker to signal that the popup
 * is alive. Sends current sync scopes so the background can resume sync
 * when the popup closes.
 */
export function useBackgroundPort(scopes: SyncScope[]) {
	const portRef = useRef<ReturnType<typeof browser.runtime.connect> | null>(
		null,
	);

	useEffect(() => {
		const port = browser.runtime.connect({ name: "popup-sync" });
		portRef.current = port;
		return () => {
			portRef.current = null;
			port.disconnect();
		};
	}, []);

	useEffect(() => {
		portRef.current?.postMessage({ scopes });
	}, [scopes]);
}
