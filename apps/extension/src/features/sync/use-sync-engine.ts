import type { StorageLevel } from "@pengana/sync-engine";
import { useNetworkStatus } from "@pengana/sync-engine";
import { useCallback, useEffect, useState } from "react";
import type { BackgroundBroadcast } from "@/shared/api/background-messages";
import { isSyncActive, isUploadActive } from "@/shared/api/background-messages";
import { sendBackgroundMessage } from "@/shared/api/send-background-message";
import { useUploadQueue } from "./use-upload-queue";

export function useSyncEngine(userId: string) {
	// --- State ---
	const [isSyncing, setIsSyncing] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [storageLevel, setStorageLevel] = useState<StorageLevel>("ok");
	const { enqueueUpload } = useUploadQueue();

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
					setStorageLevel(status.storageLevel);
				}
				await sendBackgroundMessage({ type: "sync:trigger" });
			} catch (err) {
				console.error("[sync-engine] init failed:", err);
			}
		};

		init();
	}, [userId, setIsOnline]);

	// --- Broadcast listener (single listener for all broadcast events) ---
	useEffect(() => {
		const listener = (message: BackgroundBroadcast) => {
			if (!message?.type) return;

			switch (message.type) {
				case "sync:event": {
					const active = isSyncActive(message.event);
					if (active !== null) setIsSyncing(active);
					break;
				}
				case "upload:event": {
					const active = isUploadActive(message.event);
					if (active !== null) setIsUploading(active);
					break;
				}
				case "status:update":
					setIsOnline(message.status.isOnline);
					setIsSyncing(message.status.isSyncing);
					setIsUploading(message.status.isUploading);
					setStorageLevel(message.status.storageLevel);
					break;
				case "storage:critical":
					setStorageLevel("critical");
					break;
			}
		};

		browser.runtime.onMessage.addListener(listener);
		return () => browser.runtime.onMessage.removeListener(listener);
	}, [setIsOnline]);

	// --- Public API ---
	const triggerSync = useCallback(() => {
		sendBackgroundMessage({ type: "sync:trigger" }).catch((err) =>
			console.error("[sync-engine] trigger failed:", err),
		);
	}, []);

	// --- Return ---
	return {
		core: {
			isOnline,
			isSyncing,
			isUploading,
			storageLevel,
			triggerSync,
			enqueueUpload,
		},
	};
}
