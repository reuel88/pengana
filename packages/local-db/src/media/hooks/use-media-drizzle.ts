import { and, eq, inArray } from "drizzle-orm";
import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMemo } from "react";
import type { LocalMedia, LocalMediaAttachment } from "../lib/db";
import type {
	MediaAttachmentTable,
	MediaTable,
} from "../lib/drizzle-media-actions";
import type { MediaListItem, ServerMediaRecord } from "../lib/merge-media";
import { mergeMediaRecords } from "../lib/merge-media";

export interface UseDrizzleMediaOptions {
	db: ExpoSQLiteDatabase;
	mediaTable: MediaTable;
	mediaAttachmentTable: MediaAttachmentTable;
	scopeType: "personal" | "org";
	scopeId: string;
	serverMedia?: ServerMediaRecord[];
}

export function useDrizzleMedia({
	db,
	mediaTable,
	mediaAttachmentTable,
	scopeType,
	scopeId,
	serverMedia = [],
}: UseDrizzleMediaOptions): { media: MediaListItem[] } {
	// 1. Query scoped media records from local DB
	const { data: localMediaRaw } = useLiveQuery(
		db
			.select()
			.from(mediaTable)
			.where(
				and(
					eq(mediaTable.scopeId, scopeId),
					eq(mediaTable.scopeType, scopeType),
				),
			),
		[scopeId, scopeType],
	);

	const localMedia = (localMediaRaw ?? []) as LocalMedia[];

	// 2. Derive deduplicated media IDs for the attachment query
	const mediaIds = useMemo(
		() => [...new Set(localMedia.map((item) => item.id))],
		[localMedia],
	);

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

	// 4. Merge local media + attachments with server records into a unified list
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
