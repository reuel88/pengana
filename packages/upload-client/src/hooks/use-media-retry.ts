import type { EntityDatabase } from "@pengana/entity-store";
import type { EnqueueUploadParams } from "@pengana/upload-queue";
import { useCallback } from "react";
import { getAttachmentForMedia, retryMedia } from "../lib/media-actions";

export interface MediaRetryDeps {
	db?: EntityDatabase;
	enqueueUpload: (params: EnqueueUploadParams) => void;
	triggerSync: () => void;
}

export function useMediaRetry(deps: MediaRetryDeps) {
	const { db, enqueueUpload, triggerSync } = deps;

	return useCallback(
		async (mediaId: string) => {
			if (!db) return;

			const record = await retryMedia(db, mediaId);
			if (!record?.localUri) return;

			const attachment = await getAttachmentForMedia(db, mediaId);

			enqueueUpload({
				fileUri: record.localUri,
				mimeType: record.mimeType,
				mediaId: record.id,
				entityType: attachment?.entityType,
				entityId: attachment?.entityId,
				scopeType: attachment ? undefined : record.scopeType,
			});
			triggerSync();
		},
		[db, enqueueUpload, triggerSync],
	);
}
