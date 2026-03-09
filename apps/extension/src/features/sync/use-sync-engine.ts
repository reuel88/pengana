import { useCallback, useEffect, useState } from "react";

import type {
	BackgroundBroadcast,
	SyncStatus,
} from "@/utils/background-messages";
import { sendBackgroundMessage } from "@/utils/send-background-message";

const KNOWN_BROADCAST_TYPES = new Set([
	"sync:event",
	"upload:event",
	"status:update",
]);

export function useSyncEngine(userId: string) {
	const [isOnline, setIsOnline] = useState(navigator.onLine);
	const [isSyncing, setIsSyncing] = useState(false);
	const [isUploading, setIsUploading] = useState(false);

	// Initialize background engine and trigger sync on mount
	useEffect(() => {
		const init = async () => {
			try {
				await sendBackgroundMessage({ type: "init", userId });
				const status = await sendBackgroundMessage<SyncStatus>({
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
	}, [userId]);

	// Listen for broadcasts from background
	useEffect(() => {
		const listener = (message: BackgroundBroadcast) => {
			if (!message?.type || !KNOWN_BROADCAST_TYPES.has(message.type)) return;

			switch (message.type) {
				case "sync:event":
					if (message.event.type === "sync:start") setIsSyncing(true);
					if (
						message.event.type === "sync:complete" ||
						message.event.type === "sync:error"
					) {
						setIsSyncing(false);
					}
					break;
				case "upload:event":
					if (message.event.type === "upload:start") setIsUploading(true);
					if (
						message.event.type === "upload:complete" ||
						message.event.type === "upload:error"
					) {
						setIsUploading(false);
					}
					break;
				case "status:update":
					setIsOnline(message.status.isOnline);
					setIsSyncing(message.status.isSyncing);
					setIsUploading(message.status.isUploading);
					break;
			}
		};

		browser.runtime.onMessage.addListener(listener);
		return () => browser.runtime.onMessage.removeListener(listener);
	}, []);

	// Local online/offline for UI responsiveness
	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	const triggerSync = useCallback(() => {
		sendBackgroundMessage({ type: "sync:trigger" }).catch((err) =>
			console.error("[sync-engine] trigger failed:", err),
		);
	}, []);

	const enqueueUpload = useCallback(
		(todoId: string, fileUri: string, mimeType: string) => {
			sendBackgroundMessage({
				type: "upload:enqueue",
				payload: { todoId, fileUri, mimeType },
			}).catch((err) =>
				console.error("[sync-engine] enqueue upload failed:", err),
			);
		},
		[],
	);

	return {
		isOnline,
		isSyncing,
		isUploading,
		triggerSync,
		enqueueUpload,
	};
}
