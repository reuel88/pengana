import { and, eq, inArray } from "drizzle-orm";
import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMemo } from "react";
import type { LocalMedia, LocalMediaAttachment } from "../lib/db";
import type {
	MediaAttachmentTable,
	MediaTable,
} from "../lib/drizzle-media-actions";
import type { MediaConfig } from "../lib/media-config";
import type { MediaListItem, ServerMediaRecord } from "../lib/merge-media";
import { mergeMediaRecords } from "../lib/merge-media";

export interface UseDrizzleMediaOptions {
	db: ExpoSQLiteDatabase;
	mediaTable: MediaTable;
	mediaAttachmentTable: MediaAttachmentTable;
	config: MediaConfig;
	scopeId: string;
	serverMedia?: ServerMediaRecord[];
}

export function useDrizzleMedia({
	db,
	mediaTable,
	mediaAttachmentTable,
	config,
	scopeId,
	serverMedia = [],
}: UseDrizzleMediaOptions): { media: MediaListItem[] } {
	const { data: localMediaRaw } = useLiveQuery(
		db
			.select()
			.from(mediaTable)
			.where(
				and(
					eq(mediaTable.scopeId, scopeId),
					eq(mediaTable.scopeType, config.scopeType),
				),
			),
		[scopeId, config.scopeType],
	);

	const localMedia = (localMediaRaw ?? []) as LocalMedia[];

	const mediaIds = useMemo(
		() => [...new Set(localMedia.map((item) => item.id))],
		[localMedia],
	);

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
