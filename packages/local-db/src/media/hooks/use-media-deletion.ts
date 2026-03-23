import { useCallback } from "react";
import type { MediaActions } from "./media-actions";

export interface MediaDeletionDeps {
	removeMedia: MediaActions["removeMedia"];
	triggerSync: () => void;
	deleteOnServer?: (mediaId: string) => Promise<unknown>;
}

export function useMediaDeletion(deps: MediaDeletionDeps) {
	const { removeMedia, triggerSync, deleteOnServer } = deps;

	return useCallback(
		async (mediaId: string) => {
			await removeMedia(mediaId);
			await deleteOnServer?.(mediaId);
			triggerSync();
		},
		[removeMedia, deleteOnServer, triggerSync],
	);
}
