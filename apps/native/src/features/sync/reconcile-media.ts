import type { Media, MediaAttachment } from "@pengana/sync-engine";
import { drizzleMedia } from "@pengana/upload-client";

import { appDb } from "@/shared/db/db";
import { media, mediaAttachments } from "@/shared/db/schema";

export async function reconcileNativeMedia(
	serverMedia: Media[],
	serverAttachments: MediaAttachment[],
	entityIds?: string[],
): Promise<void> {
	return drizzleMedia.reconcileMedia(
		appDb,
		media,
		mediaAttachments,
		serverMedia,
		serverAttachments,
		entityIds,
	);
}
