import type { EntityDatabase } from "@pengana/entity-store";
import { useCallback } from "react";
import { getAttachmentForMedia, retryMedia } from "../lib/media-actions";

export interface MediaRetryDeps {
	db?: EntityDatabase;
	enqueueUpload: (
		fileUri: string,
		mimeType: string,
		mediaId: string,
		entityType?: string,
		entityId?: string,
		scopeType?: "personal" | "org",
	) => void;
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

			enqueueUpload(
				record.localUri,
				record.mimeType,
				record.id,
				attachment?.entityType,
				attachment?.entityId,
				attachment ? undefined : record.scopeType,
			);
			triggerSync();
		},
		[db, enqueueUpload, triggerSync],
	);
}
