import {
	findMediaAttachmentsByMediaIds,
	findMediaByScope,
} from "@pengana/db/media-queries";
import { mediaAttachmentSchema, mediaSchema } from "@pengana/sync-engine";
import { z } from "zod";

import { apiError } from "../errors";
import {
	envelope,
	envelopeOutput,
	protectedProcedure,
	seatedProcedure,
} from "../index";
import { handleMediaSync } from "./media-sync";

const mediaOutputSchema = z.object({
	id: z.string(),
	userId: z.string(),
	url: z.string().nullable(),
	mimeType: z.string(),
	createdAt: z.coerce.string(),
	updatedAt: z.coerce.string(),
	scopeType: z.enum(["personal", "org"]),
	scopeId: z.string(),
	organizationId: z.string(),
	createdBy: z.string(),
});

const mediaAttachmentOutputSchema = z.object({
	id: z.string(),
	mediaId: z.string(),
	entityType: z.string(),
	entityId: z.string(),
	position: z.number(),
	createdAt: z.coerce.string(),
});

const mediaWithAttachmentsSchema = mediaOutputSchema.extend({
	attachments: z.array(mediaAttachmentOutputSchema),
});

const mediaSyncInputSchema = z.object({
	lastSyncedAt: z.string().nullable(),
});

const mediaSyncOutputSchema = z.object({
	media: z.array(mediaSchema),
	mediaAttachments: z.array(mediaAttachmentSchema),
	syncedAt: z.string(),
});

export const mediaRouter = {
	sync: seatedProcedure
		.route({
			method: "POST",
			path: "/media/sync",
			summary: "Sync personal media",
		})
		.input(mediaSyncInputSchema)
		.output(envelopeOutput(mediaSyncOutputSchema))
		.handler(async ({ input, context }) => {
			const userId = context.session.user.id;
			return envelope(
				await handleMediaSync(input.lastSyncedAt, "personal", userId),
			);
		}),

	orgSync: seatedProcedure
		.route({
			method: "POST",
			path: "/media/org-sync",
			summary: "Sync organization media",
		})
		.input(mediaSyncInputSchema)
		.output(envelopeOutput(mediaSyncOutputSchema))
		.handler(async ({ input, context }) => {
			const orgId = context.session.session.activeOrganizationId as string;
			return envelope(await handleMediaSync(input.lastSyncedAt, "org", orgId));
		}),

	listMedia: protectedProcedure
		.route({
			method: "GET",
			path: "/media/list",
			summary: "List media for current scope",
		})
		.input(
			z.object({
				limit: z.number().int().min(1).max(100).optional(),
				offset: z.number().int().min(0).optional(),
				scopeType: z.enum(["personal", "org"]).optional(),
			}),
		)
		.output(envelopeOutput(z.array(mediaWithAttachmentsSchema)))
		.handler(async ({ input, context }) => {
			const userId = context.session.user.id;
			const activeOrgId = context.session.session.activeOrganizationId;

			const scopeType = input.scopeType ?? (activeOrgId ? "org" : "personal");
			const scopeId =
				scopeType === "org"
					? (activeOrgId ??
						(() => {
							throw apiError(
								"BAD_REQUEST",
								"Organization scope requires an active organization.",
							);
						})())
					: userId;

			const mediaRows = await findMediaByScope({
				scopeType,
				scopeId,
				limit: input.limit,
				offset: input.offset,
			});

			const mediaIds = mediaRows.map((m) => m.id);
			const attachmentRows = await findMediaAttachmentsByMediaIds(mediaIds);

			const attachmentsByMediaId = new Map<string, typeof attachmentRows>();
			for (const att of attachmentRows) {
				const list = attachmentsByMediaId.get(att.mediaId) ?? [];
				list.push(att);
				attachmentsByMediaId.set(att.mediaId, list);
			}

			const result = mediaRows.map((m) => ({
				...m,
				createdAt: m.createdAt.toISOString(),
				updatedAt: m.updatedAt.toISOString(),
				attachments: (attachmentsByMediaId.get(m.id) ?? []).map((a) => ({
					...a,
					createdAt: a.createdAt.toISOString(),
				})),
			}));

			return envelope(result);
		}),
};
