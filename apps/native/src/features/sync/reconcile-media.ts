import type { Media } from "@pengana/sync-engine";
import { and, eq, inArray, notInArray } from "drizzle-orm";

import { appDb } from "@/features/todo/entities/todo/db";
import { media } from "@/features/todo/entities/todo/schema";

export async function reconcileNativeMedia(
	serverMedia: Media[],
	entityIds?: string[],
): Promise<void> {
	await appDb.transaction(async (tx) => {
		// Batch-fetch all existing local media for the incoming server IDs
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
					entityId: sa.entityId,
					entityType: sa.entityType,
					userId: sa.userId,
					url: sa.url,
					localUri: null,
					status: sa.url ? "uploaded" : null,
					mimeType: sa.mimeType,
					position: sa.position,
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

		// Remove local media that the server no longer has for the synced entities
		if (entityIds && entityIds.length > 0) {
			const serverMediaIds = serverMedia.map((m) => m.id);
			for (const entityId of entityIds) {
				if (serverMediaIds.length > 0) {
					await tx
						.delete(media)
						.where(
							and(
								eq(media.entityId, entityId),
								notInArray(media.id, serverMediaIds),
								eq(media.status, "uploaded"),
							),
						);
				} else {
					await tx
						.delete(media)
						.where(
							and(eq(media.entityId, entityId), eq(media.status, "uploaded")),
						);
				}
			}
		}
	});
}
