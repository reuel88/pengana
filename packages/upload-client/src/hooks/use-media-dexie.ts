import type { EntityDatabase } from "@pengana/entity-store";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";

import type { LocalMedia, LocalMediaAttachment } from "../lib/db";
import type { MediaConfig } from "../lib/media-config";
import type { MediaListItem } from "../lib/merge-media";

export interface UseMediaOptions {
	db: EntityDatabase;
	config: MediaConfig;
	scopeId: string;
	organizationId?: string;
}

export function useMedia({
	db,
	config,
	scopeId,
	organizationId,
}: UseMediaOptions): {
	media: MediaListItem[];
} {
	const localMedia =
		useLiveQuery(
			(): Promise<LocalMedia[]> =>
				db
					.getTable<LocalMedia>("media")
					.where("scopeId")
					.equals(scopeId)
					.and(
						(item) =>
							item.scopeType === config.scopeType &&
							(!organizationId || item.organizationId === organizationId),
					)
					.toArray(),
			[db, config.scopeType, scopeId, organizationId],
			[] as LocalMedia[],
		) ?? [];

	const mediaIds = useMemo(
		() => [...new Set(localMedia.map((item) => item.id))],
		[localMedia],
	);

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

	const attachmentsByMediaId = useMemo(() => {
		const map = new Map<string, LocalMediaAttachment[]>();
		for (const att of localAttachments) {
			const list = map.get(att.mediaId) ?? [];
			list.push(att);
			map.set(att.mediaId, list);
		}
		return map;
	}, [localAttachments]);

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
