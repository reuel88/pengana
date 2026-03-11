import { useCallback, useEffect, useState } from "react";
import type { BackgroundBroadcast } from "@/utils/background-messages";
import { isUploadActive } from "@/utils/background-messages";
import { sendBackgroundMessage } from "@/utils/send-background-message";

export function useUploadQueue() {
	const [isUploading, setIsUploading] = useState(false);

	// Listen for upload broadcast events
	useEffect(() => {
		const listener = (message: BackgroundBroadcast) => {
			if (message?.type === "upload:event") {
				const active = isUploadActive(message.event);
				if (active !== null) setIsUploading(active);
			}
		};
		browser.runtime.onMessage.addListener(listener);
		return () => browser.runtime.onMessage.removeListener(listener);
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

	return { isUploading, setIsUploading, enqueueUpload };
}
