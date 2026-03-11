import { useCallback } from "react";
import { sendBackgroundMessage } from "@/shared/api/send-background-message";

export function useUploadQueue() {
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

	return { enqueueUpload };
}
