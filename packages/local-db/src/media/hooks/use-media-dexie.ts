import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useRef } from "react";
import type { EntityDatabase } from "../../dexie";
import { useDexieEntity } from "../../hooks/use-dexie-entity";

import type { LocalMedia, LocalMediaAttachment } from "../lib/db";
import type { MediaListItem } from "../lib/merge-media";

export interface UseMediaOptions {
	db: EntityDatabase;
	scopeId: string;
	filter?: (item: LocalMedia) => boolean;
}

export function useMedia({ db, scopeId, filter }: UseMediaOptions): {
	media: MediaListItem[];
} {
	// 1. Query scoped media records from local DB
	const { items: localMedia } = useDexieEntity<LocalMedia>(
		db,
		"media",
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
	const localAttachments =
		useLiveQuery(
			(): Promise<LocalMediaAttachment[]> => {
				if (mediaIds.length === 0) return Promise.resolve([]);
				return db
					.getTable<LocalMediaAttachment>("mediaAttachments")
					.where("mediaId")
					.anyOf(mediaIds)
					.toArray();
			},
			[db, mediaIds],
			[] as LocalMediaAttachment[],
		) ?? [];

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
