import type { EntityDatabase } from "@pengana/entity-store";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";

import type { LocalMedia, LocalMediaAttachment } from "../lib/db";
import type { MediaConfig } from "../lib/media-config";
import {
	type MediaListItem,
	mergeMediaRecords,
	type ServerMediaRecord,
} from "../lib/merge-media";

export interface UseMediaOptions {
	db: EntityDatabase;
	config: MediaConfig;
	scopeId: string;
	serverMedia?: ServerMediaRecord[];
}

export function useMedia({
	db,
	config,
	scopeId,
	serverMedia = [],
}: UseMediaOptions): { media: MediaListItem[] } {
	const localMedia =
		useLiveQuery(
			(): Promise<LocalMedia[]> =>
				db
					.getTable<LocalMedia>("media")
					.where("scopeId")
					.equals(scopeId)
					.and((item) => item.scopeType === config.scopeType)
					.toArray(),
			[db, config.scopeType, scopeId],
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

	const media = useMemo(
		() =>
			mergeMediaRecords({
				localMedia,
				localAttachments,
				serverMedia,
			}),
		[localAttachments, localMedia, serverMedia],
	);

	return { media };
}
