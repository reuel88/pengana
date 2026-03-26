import { eq, inArray } from "drizzle-orm";
import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMemo, useRef } from "react";
import { useDrizzleEntity } from "../../hooks/use-drizzle-entity";
import type { LocalMedia, LocalMediaAttachment } from "../lib/db";
import type {
	MediaAttachmentTable,
	MediaTable,
} from "../lib/drizzle-media-actions";
import type { MediaListItem } from "../lib/merge-media";

export interface UseDrizzleMediaOptions {
	db: ExpoSQLiteDatabase;
	mediaTable: MediaTable;
	mediaAttachmentTable: MediaAttachmentTable;
	scopeId: string;
	filter?: (item: LocalMedia) => boolean;
}

export function useMedia({
	db,
	mediaTable,
	mediaAttachmentTable,
	scopeId,
	filter,
}: UseDrizzleMediaOptions): { media: MediaListItem[] } {
	// 1. Query scoped media records from local DB
	const { items: localMedia } = useDrizzleEntity<LocalMedia>(
		db,
		mediaTable,
		scopeId,
		filter,
	);

	// 2. Derive deduplicated media IDs for the attachment query
	const mediaIdsRef = useRef<string[]>([]);
	const mediaIds = useMemo(() => {
		const next = localMedia.map((item) => item.id);
		const prev = mediaIdsRef.current;
		if (next.length === prev.length && next.every((id, i) => id === prev[i])) {
			return prev;
		}
		mediaIdsRef.current = next;
		return next;
	}, [localMedia]);

	// 3. Query attachments linked to those media IDs
	const { data: localAttachmentsRaw } = useLiveQuery(
		mediaIds.length > 0
			? db
					.select()
					.from(mediaAttachmentTable)
					.where(inArray(mediaAttachmentTable.mediaId, mediaIds))
			: db
					.select()
					.from(mediaAttachmentTable)
					.where(eq(mediaAttachmentTable.mediaId, "__none__")),
		[mediaIds],
	);

	const localAttachments = (localAttachmentsRaw ??
		[]) as LocalMediaAttachment[];

	// 4. Group attachments by media ID
	const attachmentsByMediaId = useMemo(() => {
		const map = new Map<string, LocalMediaAttachment[]>();
		for (const att of localAttachments) {
			const list = map.get(att.mediaId) ?? [];
			list.push(att);
			map.set(att.mediaId, list);
		}
		return map;
	}, [localAttachments]);

	// 5. Merge media + attachments into a unified list
	const media = useMemo(
		() =>
			localMedia
				.map(
					(m): MediaListItem => ({
						id: m.id,
						userId: m.userId,
						url: m.url,
						localUri: m.localUri,
						mimeType: m.mimeType,
						status: m.status,
						createdAt: m.createdAt,
						updatedAt: m.updatedAt,
						scopeType: m.scopeType,
						scopeId: m.scopeId,
						organizationId: m.organizationId,
						createdBy: m.createdBy,
						attachments: (attachmentsByMediaId.get(m.id) ?? []).sort(
							(a, b) => a.position - b.position,
						),
						isLocalOnly: m.status !== "uploaded",
					}),
				)
				.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
		[localMedia, attachmentsByMediaId],
	);

	return { media };
}
