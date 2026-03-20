import type { Media, MediaAttachment } from "@pengana/sync-engine";
import { buildReconcilePlan } from "@pengana/upload-client";
import { and, eq, inArray, notInArray } from "drizzle-orm";

import { appDb } from "@/shared/db/db";
import { media, mediaAttachments } from "@/shared/db/schema";

export async function reconcileNativeMedia(
	serverMedia: Media[],
	serverAttachments: MediaAttachment[],
	entityIds?: string[],
): Promise<void> {
	await appDb.transaction(async (tx) => {
		// --- Query local state ---
		const serverIds = serverMedia.map((m) => m.id);
		const existingRows =
			serverIds.length > 0
				? await tx.select().from(media).where(inArray(media.id, serverIds))
				: [];
		const existingMediaById = new Map(
			existingRows.map((r) => [r.id, { id: r.id, url: r.url }]),
		);

		const existingAttachmentsByEntityId = new Map<
			string,
			{ id: string; mediaId: string }[]
		>();
		const existingAttachmentIds = new Set<string>();

		if (entityIds && entityIds.length > 0) {
			for (const entityId of entityIds) {
				const localAtts = await tx
					.select()
					.from(mediaAttachments)
					.where(eq(mediaAttachments.entityId, entityId));
				const mapped = localAtts.map((a) => ({
					id: a.id,
					mediaId: a.mediaId,
				}));
				existingAttachmentsByEntityId.set(entityId, mapped);
				for (const att of localAtts) {
					existingAttachmentIds.add(att.id);
				}
			}
		}

		const serverAttIds = serverAttachments.map((a) => a.id);
		if (serverAttIds.length > 0) {
			const existingAtts = await tx
				.select()
				.from(mediaAttachments)
				.where(inArray(mediaAttachments.id, serverAttIds));
			for (const att of existingAtts) {
				existingAttachmentIds.add(att.id);
			}
		}

		let uploadedMediaNotOnServer: {
			id: string;
			attachmentCount: number;
		}[] = [];
		if (entityIds && entityIds.length > 0) {
			const serverMediaIds = serverMedia.map((m) => m.id);

			// Get media IDs scoped to the synced entities
			const scopedAtts = await tx
				.select({ mediaId: mediaAttachments.mediaId })
				.from(mediaAttachments)
				.where(inArray(mediaAttachments.entityId, entityIds));
			const scopedMediaIds = [...new Set(scopedAtts.map((a) => a.mediaId))];

			const orphanCandidates =
				scopedMediaIds.length === 0
					? []
					: serverMediaIds.length > 0
						? await tx
								.select({ id: media.id })
								.from(media)
								.where(
									and(
										eq(media.status, "uploaded"),
										inArray(media.id, scopedMediaIds),
										notInArray(media.id, serverMediaIds),
									),
								)
						: await tx
								.select({ id: media.id })
								.from(media)
								.where(
									and(
										eq(media.status, "uploaded"),
										inArray(media.id, scopedMediaIds),
									),
								);

			uploadedMediaNotOnServer = await Promise.all(
				orphanCandidates.map(async (c) => {
					const remaining = await tx
						.select({ id: mediaAttachments.id })
						.from(mediaAttachments)
						.where(eq(mediaAttachments.mediaId, c.id))
						.limit(1);
					return { id: c.id, attachmentCount: remaining.length };
				}),
			);
		}

		// --- Build plan ---
		const plan = buildReconcilePlan({
			serverMedia,
			serverAttachments,
			existingMediaById,
			existingAttachmentsByEntityId,
			existingAttachmentIds,
			uploadedMediaNotOnServer,
			entityIds,
		});

		// --- Execute plan with Drizzle ---
		if (plan.mediaToInsert.length > 0) {
			await tx.insert(media).values(plan.mediaToInsert);
		}
		for (const update of plan.mediaToUpdate) {
			await tx
				.update(media)
				.set({ url: update.url, status: "uploaded" })
				.where(eq(media.id, update.id));
		}
		if (plan.attachmentsToInsert.length > 0) {
			await tx.insert(mediaAttachments).values(plan.attachmentsToInsert);
		}
		if (plan.attachmentIdsToDelete.length > 0) {
			await tx
				.delete(mediaAttachments)
				.where(inArray(mediaAttachments.id, plan.attachmentIdsToDelete));
		}
		for (const mId of plan.mediaIdsToDelete) {
			await tx.delete(media).where(eq(media.id, mId));
		}
	});
}
