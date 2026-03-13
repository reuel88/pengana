import { useCallback } from "react";
import type { SyncScopeType } from "@/shared/api/background-messages";
import { sendBackgroundMessage } from "@/shared/api/send-background-message";

export function useUploadQueue(scopeType: SyncScopeType, scopeId: string) {
	const enqueueUpload = useCallback(
		(todoId: string, fileUri: string, mimeType: string) => {
			sendBackgroundMessage({
				type: "upload:enqueue",
				scopeType,
				scopeId,
				payload: { todoId, fileUri, mimeType },
			}).catch((err) =>
				console.error("[sync-engine] enqueue upload failed:", err),
			);
		},
		[scopeId, scopeType],
	);

	return { enqueueUpload };
}
