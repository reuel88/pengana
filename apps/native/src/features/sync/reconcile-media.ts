import type { Media } from "@pengana/sync-engine";
import { and, eq, notInArray } from "drizzle-orm";

import { appDb } from "@/features/todo/entities/todo/db";
import { media } from "@/features/todo/entities/todo/schema";

export async function reconcileNativeMedia(
	serverMedia: Media[],
	entityIds?: string[],
): Promise<void> {
	await appDb.transaction(async (tx) => {
		for (const sa of serverMedia) {
			const [existing] = await tx
				.select()
				.from(media)
				.where(eq(media.id, sa.id));

			if (existing) {
				if (sa.url && existing.url !== sa.url) {
					await tx
						.update(media)
						.set({
							url: sa.url,
							status: "uploaded",
						})
						.where(eq(media.id, sa.id));
				}
			} else {
				await tx.insert(media).values({
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
				});
			}
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
							),
						);
				} else {
					await tx.delete(media).where(eq(media.entityId, entityId));
				}
			}
		}
	});
}
