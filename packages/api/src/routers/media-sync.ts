import { getLogger } from "@logtape/logtape";
import {
	findMediaAttachmentsByMediaIds,
	getMediaUpdatedSince,
} from "@pengana/db/media-queries";

const logger = getLogger(["app", "media-sync"]);

const OVERLAP_MS = 5_000;

export async function handleMediaSync(
	lastSyncedAt: string | null,
	scopeType: "personal" | "org",
	scopeId: string,
) {
	const now = new Date();

	const since = lastSyncedAt
		? new Date(new Date(lastSyncedAt).getTime() - OVERLAP_MS)
		: new Date(0);

	logger.debug`Media sync for ${scopeType}:${scopeId} since ${since.toISOString()}`;

	const mediaRows = await getMediaUpdatedSince(scopeType, scopeId, since);
	const mediaIds = mediaRows.map((m) => m.id);
	const attachmentRows = await findMediaAttachmentsByMediaIds(mediaIds);

	logger.debug`Media sync completed for ${scopeType}:${scopeId}: ${String(mediaRows.length)} media, ${String(attachmentRows.length)} attachments`;

	return {
		media: mediaRows.map((m) => ({
			id: m.id,
			userId: m.userId,
			url: m.url ?? null,
			mimeType: m.mimeType,
			createdAt: m.createdAt.toISOString(),
			updatedAt: m.updatedAt.toISOString(),
			scopeType: m.scopeType,
			scopeId: m.scopeId,
			organizationId: m.organizationId,
			createdBy: m.createdBy,
		})),
		mediaAttachments: attachmentRows.map((att) => ({
			id: att.id,
			mediaId: att.mediaId,
			entityType: att.entityType,
			entityId: att.entityId,
			position: att.position,
			createdAt: att.createdAt.toISOString(),
		})),
		syncedAt: now.toISOString(),
	};
}
