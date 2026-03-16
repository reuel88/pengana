import type { Media, MediaAttachment } from "@pengana/sync-engine";
import { and, eq, inArray, notInArray } from "drizzle-orm";

import { appDb } from "@/features/todo/entities/todo/db";
import { media, mediaAttachments } from "@/features/todo/entities/todo/schema";

export async function reconcileNativeMedia(
	serverMedia: Media[],
	serverAttachments: MediaAttachment[],
	entityIds?: string[],
): Promise<void> {
	await appDb.transaction(async (tx) => {
		// --- Reconcile media records ---
		const serverIds = serverMedia.map((m) => m.id);
		const existingRows =
			serverIds.length > 0
				? await tx.select().from(media).where(inArray(media.id, serverIds))
				: [];
		const existingMap = new Map(existingRows.map((r) => [r.id, r]));

		const toInsert: (typeof media.$inferInsert)[] = [];
		const toUpdate: { id: string; url: string }[] = [];

		for (const sa of serverMedia) {
			const existing = existingMap.get(sa.id);

			if (existing) {
				if (sa.url && existing.url !== sa.url) {
					toUpdate.push({ id: sa.id, url: sa.url });
				}
			} else {
				toInsert.push({
					id: sa.id,
					userId: sa.userId,
					url: sa.url,
					localUri: null,
					status: sa.url ? "uploaded" : null,
					mimeType: sa.mimeType,
					createdAt: sa.createdAt,
					updatedAt: sa.updatedAt,
					scopeType: sa.scopeType,
					scopeId: sa.scopeId,
					organizationId: sa.organizationId,
					createdBy: sa.createdBy,
				});
			}
		}

		if (toInsert.length > 0) {
			await tx.insert(media).values(toInsert);
		}

		for (const item of toUpdate) {
			await tx
				.update(media)
				.set({ url: item.url, status: "uploaded" })
				.where(eq(media.id, item.id));
		}

		// --- Reconcile media_attachments ---
		const attToInsert: (typeof mediaAttachments.$inferInsert)[] = [];
		const serverAttIds = serverAttachments.map((a) => a.id);
		const existingAtts =
			serverAttIds.length > 0
				? await tx
						.select()
						.from(mediaAttachments)
						.where(inArray(mediaAttachments.id, serverAttIds))
				: [];
		const existingAttMap = new Map(existingAtts.map((r) => [r.id, r]));

		for (const sa of serverAttachments) {
			if (!existingAttMap.has(sa.id)) {
				attToInsert.push({
					id: sa.id,
					mediaId: sa.mediaId,
					entityType: sa.entityType,
					entityId: sa.entityId,
					position: sa.position,
					createdAt: sa.createdAt,
				});
			}
		}

		if (attToInsert.length > 0) {
			await tx.insert(mediaAttachments).values(attToInsert);
		}

		// Remove local attachment records that the server no longer has for the synced entities
		if (entityIds && entityIds.length > 0) {
			for (const entityId of entityIds) {
				if (serverAttIds.length > 0) {
					await tx
						.delete(mediaAttachments)
						.where(
							and(
								eq(mediaAttachments.entityId, entityId),
								notInArray(mediaAttachments.id, serverAttIds),
							),
						);
				} else {
					await tx
						.delete(mediaAttachments)
						.where(eq(mediaAttachments.entityId, entityId));
				}
			}

			// Remove uploaded media that are no longer attached to ANY entity
			const serverMediaIds = serverMedia.map((m) => m.id);
			if (serverMediaIds.length > 0) {
				const orphanCandidates = await tx
					.select({ id: media.id })
					.from(media)
					.where(
						and(
							eq(media.status, "uploaded"),
							notInArray(media.id, serverMediaIds),
						),
					);
				for (const candidate of orphanCandidates) {
					const remaining = await tx
						.select({ id: mediaAttachments.id })
						.from(mediaAttachments)
						.where(eq(mediaAttachments.mediaId, candidate.id))
						.limit(1);
					if (remaining.length === 0) {
						await tx.delete(media).where(eq(media.id, candidate.id));
					}
				}
			}
		}
	});
}
