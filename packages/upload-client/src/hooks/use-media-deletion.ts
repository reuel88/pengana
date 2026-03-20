import type { EntityDatabase } from "@pengana/entity-store";
import { useCallback } from "react";
import { removeMedia } from "../lib/media-actions";

export interface MediaDeletionDeps {
	db?: EntityDatabase;
	triggerSync: () => void;
	deleteOnServer?: (mediaId: string) => Promise<unknown>;
}

export function useMediaDeletion(deps: MediaDeletionDeps) {
	const { db, triggerSync, deleteOnServer } = deps;

	return useCallback(
		async (mediaId: string) => {
			if (!db) return;
			await removeMedia(db, mediaId);
			await deleteOnServer?.(mediaId);
			triggerSync();
		},
		[db, deleteOnServer, triggerSync],
	);
}
