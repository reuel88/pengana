import type { EnqueueUploadParams } from "@pengana/sync/upload";
import { useCallback } from "react";
import type { MediaActions } from "./media-actions";

export interface MediaRetryDeps {
	retryMedia: MediaActions["retryMedia"];
	getAttachmentForMedia: MediaActions["getAttachmentForMedia"];
	enqueueUpload: (params: EnqueueUploadParams) => void;
	triggerSync: () => void;
}

export function useMediaRetry(deps: MediaRetryDeps) {
	const { retryMedia, getAttachmentForMedia, enqueueUpload, triggerSync } =
		deps;

	return useCallback(
		async (mediaId: string) => {
			const record = await retryMedia(mediaId);
			if (!record?.localUri) return;

			const attachment = await getAttachmentForMedia(mediaId);

			enqueueUpload({
				fileUri: record.localUri,
				mimeType: record.mimeType,
				mediaId: record.id,
				entityType: attachment?.entityType,
				entityId: attachment?.entityId,
				scopeType: attachment
					? undefined
					: (record.scopeType as "personal" | "org" | undefined),
			});
			triggerSync();
		},
		[retryMedia, getAttachmentForMedia, enqueueUpload, triggerSync],
	);
}
