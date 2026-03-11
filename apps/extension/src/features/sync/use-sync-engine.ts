import { useNetworkStatus } from "@pengana/sync-engine";
import { useCallback, useEffect, useState } from "react";
import type { BackgroundBroadcast } from "@/utils/background-messages";
import { isSyncActive } from "@/utils/background-messages";
import { sendBackgroundMessage } from "@/utils/send-background-message";
import { useUploadQueue } from "./use-upload-queue";

export function useSyncEngine(userId: string) {
	// --- State ---
	const [isSyncing, setIsSyncing] = useState(false);
	const { isUploading, setIsUploading, enqueueUpload } = useUploadQueue();

	// --- Network Status ---
	const { isOnline, setIsOnline } = useNetworkStatus();

	// --- Engine Init Effect (delegates to background) ---
	useEffect(() => {
		const init = async () => {
			try {
				await sendBackgroundMessage({ type: "init", userId });
				const status = await sendBackgroundMessage({
					type: "status:get",
				});
				if (status) {
					setIsOnline(status.isOnline);
					setIsSyncing(status.isSyncing);
					setIsUploading(status.isUploading);
				}
				await sendBackgroundMessage({ type: "sync:trigger" });
			} catch (err) {
				console.error("[sync-engine] init failed:", err);
			}
		};

		init();
	}, [userId, setIsOnline, setIsUploading]);

	// --- Online Reactivity (broadcast listener) ---
	useEffect(() => {
		const listener = (message: BackgroundBroadcast) => {
			if (!message?.type) return;

			switch (message.type) {
				case "sync:event": {
					const active = isSyncActive(message.event);
					if (active !== null) setIsSyncing(active);
					break;
				}
				case "status:update":
					setIsOnline(message.status.isOnline);
					setIsSyncing(message.status.isSyncing);
					setIsUploading(message.status.isUploading);
					break;
			}
		};

		browser.runtime.onMessage.addListener(listener);
		return () => browser.runtime.onMessage.removeListener(listener);
	}, [setIsOnline, setIsUploading]);

	// --- Public API ---
	const triggerSync = useCallback(() => {
		sendBackgroundMessage({ type: "sync:trigger" }).catch((err) =>
			console.error("[sync-engine] trigger failed:", err),
		);
	}, []);

	// --- Return ---
	// Flat shape -- no devtools in extension
	return {
		isOnline,
		isSyncing,
		isUploading,
		triggerSync,
		enqueueUpload,
	};
}
