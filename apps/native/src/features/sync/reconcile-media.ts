import type { Media, MediaAttachment } from "@pengana/sync/core";
import { drizzleMedia } from "@pengana/upload-client";

import { appDb } from "@/shared/db/db";
import { media, mediaAttachments } from "@/shared/db/schema";

export async function reconcileNativeMedia(
	serverMedia: Media[],
	serverAttachments: MediaAttachment[],
	entityIds?: string[],
): Promise<void> {
	return drizzleMedia.reconcileMedia({
		db: appDb,
		mediaTable: media,
		mediaAttachmentTable: mediaAttachments,
		serverMedia,
		serverAttachments,
		entityIds,
	});
}
