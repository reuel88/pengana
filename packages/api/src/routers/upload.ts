import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
	attachMedia,
	countMediaByEntityId,
	deleteMedia,
	detachMedia,
	findAttachmentsByMedia,
	findMediaById,
	insertMedia,
} from "@pengana/db/media-queries";
import {
	autoSeatOwner,
	isMemberSeatedByUserId,
} from "@pengana/db/seat-queries";
import { findTodoById, updateTodo } from "@pengana/db/todo-queries";
import {
	ALLOWED_MIME_TYPES,
	MAX_ATTACHMENTS,
	MAX_FILE_SIZE_BYTES,
	MIME_TO_EXT,
} from "@pengana/sync-engine";
import { z } from "zod";

import { apiError } from "../errors";
import { envelope, envelopeOutput, protectedProcedure } from "../index";

const UPLOADS_DIR = join(process.cwd(), "uploads");

export const uploadRouter = {
	upload: protectedProcedure
		.route({
			method: "POST",
			path: "/upload",
			summary: "Upload a file",
		})
		.input(
			z.object({
				fileName: z.string(),
				mimeType: z.enum(ALLOWED_MIME_TYPES),
				data: z.string(),
				idempotencyKey: z.string().uuid(),
				attachmentId: z.string().uuid(),
				entityType: z.string().optional(),
				entityId: z.string().optional(),
			}),
		)
		.output(
			envelopeOutput(
				z.object({
					url: z.string(),
					mediaId: z.string(),
				}),
			),
		)
		.handler(async ({ input, context }) => {
			const userId = context.session.user.id;
			const activeOrgId = context.session.session.activeOrganizationId;

			const existingMedia = await findMediaById(input.attachmentId);
			if (existingMedia && existingMedia.userId !== userId) {
				throw apiError(
					"FORBIDDEN",
					context.t("attachmentBelongsToAnotherUser"),
				);
			}

			const buffer = Buffer.from(input.data, "base64");

			if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
				throw apiError("BAD_REQUEST", context.t("fileTooLarge"));
			}

			await mkdir(UPLOADS_DIR, { recursive: true });

			const ext = MIME_TO_EXT[input.mimeType] ?? "bin";
			const filename = `${input.idempotencyKey}.${ext}`;
			const filepath = join(UPLOADS_DIR, filename);
			const url = `/uploads/${filename}`;

			try {
				await access(filepath);
			} catch (err) {
				if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
				await writeFile(filepath, buffer);
			}

			const scopeType = activeOrgId ? "org" : "personal";
			const scopeId = activeOrgId ?? userId;

			await insertMedia({
				id: input.attachmentId,
				userId,
				url,
				mimeType: input.mimeType,
				scopeType,
				scopeId,
				organizationId: activeOrgId ?? null,
				createdBy: userId,
				updatedAt: new Date(),
			});

			if (input.entityType && input.entityId) {
				const count = await countMediaByEntityId(input.entityId);
				if (count < MAX_ATTACHMENTS) {
					await attachMedia(
						input.attachmentId,
						input.entityType,
						input.entityId,
						count,
					);
					if (input.entityType === "todo") {
						await updateTodo(input.entityId, { updatedAt: new Date() });
					}
				}
			}

			if (activeOrgId) {
				context.notifyOrgMembers(activeOrgId);
			} else {
				context.notifyUser(userId);
			}

			return envelope({
				url,
				mediaId: input.attachmentId,
			});
		}),

	attachMedia: protectedProcedure
		.route({
			method: "POST",
			path: "/attach-media",
			summary: "Attach a media item to an entity",
		})
		.input(
			z.object({
				mediaId: z.string().uuid(),
				entityType: z.string(),
				entityId: z.string(),
			}),
		)
		.output(envelopeOutput(z.object({ attachmentId: z.string() })))
		.handler(async ({ input, context }) => {
			const userId = context.session.user.id;
			const activeOrgId = context.session.session.activeOrganizationId;

			const mediaRecord = await findMediaById(input.mediaId);
			if (!mediaRecord) {
				throw apiError("NOT_FOUND", context.t("attachmentNotFound"));
			}
			if (mediaRecord.userId !== userId) {
				throw apiError(
					"FORBIDDEN",
					context.t("attachmentBelongsToAnotherUser"),
				);
			}

			if (input.entityType === "todo") {
				const todoRow = await findTodoById(input.entityId);
				if (!todoRow) {
					throw apiError("NOT_FOUND", context.t("todoNotFound"));
				}

				if (todoRow.scopeType === "org") {
					if (!activeOrgId || todoRow.scopeId !== activeOrgId) {
						throw apiError("NOT_FOUND", context.t("todoNotFound"));
					}
					let seated = await isMemberSeatedByUserId(activeOrgId, userId);
					if (!seated) {
						seated = await autoSeatOwner(activeOrgId, userId);
					}
					if (!seated) {
						throw apiError("FORBIDDEN", context.t("seatRequiredForWrite"));
					}
				} else if (todoRow.userId !== userId) {
					throw apiError("NOT_FOUND", context.t("todoNotFound"));
				}
			}

			const count = await countMediaByEntityId(input.entityId);
			if (count >= MAX_ATTACHMENTS) {
				throw apiError("BAD_REQUEST", context.t("tooManyAttachments"));
			}

			const row = await attachMedia(
				input.mediaId,
				input.entityType,
				input.entityId,
				count,
			);

			const now = new Date();
			if (input.entityType === "todo") {
				await updateTodo(input.entityId, { updatedAt: now });
			}

			if (activeOrgId) {
				context.notifyOrgMembers(activeOrgId);
			} else {
				context.notifyUser(userId);
			}

			return envelope({ attachmentId: row.id });
		}),

	detachMedia: protectedProcedure
		.route({
			method: "POST",
			path: "/detach-media",
			summary: "Detach a media item from an entity",
		})
		.input(
			z.object({
				mediaId: z.string().uuid(),
				entityType: z.string(),
				entityId: z.string(),
			}),
		)
		.output(envelopeOutput(z.object({ detached: z.boolean() })))
		.handler(async ({ input, context }) => {
			const userId = context.session.user.id;
			const activeOrgId = context.session.session.activeOrganizationId;

			const mediaRecord = await findMediaById(input.mediaId);
			if (!mediaRecord) {
				throw apiError("NOT_FOUND", context.t("attachmentNotFound"));
			}
			if (mediaRecord.userId !== userId) {
				throw apiError("FORBIDDEN", context.t("notAttachmentOwner"));
			}

			await detachMedia(input.mediaId, input.entityType, input.entityId);

			const now = new Date();
			if (input.entityType === "todo") {
				await updateTodo(input.entityId, { updatedAt: now });
			}

			if (activeOrgId) {
				context.notifyOrgMembers(activeOrgId);
			} else {
				context.notifyUser(userId);
			}

			return envelope({ detached: true });
		}),

	deleteMedia: protectedProcedure
		.route({
			method: "POST",
			path: "/delete-media",
			summary: "Delete a media item and all its attachments",
		})
		.input(
			z.object({
				mediaId: z.string().uuid(),
			}),
		)
		.output(envelopeOutput(z.object({ deleted: z.boolean() })))
		.handler(async ({ input, context }) => {
			const userId = context.session.user.id;
			const activeOrgId = context.session.session.activeOrganizationId;

			const mediaRecord = await findMediaById(input.mediaId);
			if (!mediaRecord) {
				throw apiError("NOT_FOUND", context.t("attachmentNotFound"));
			}

			if (mediaRecord.scopeType === "org") {
				if (!activeOrgId || mediaRecord.organizationId !== activeOrgId) {
					throw apiError("NOT_FOUND", context.t("attachmentNotFound"));
				}
				let seated = await isMemberSeatedByUserId(activeOrgId, userId);
				if (!seated) {
					seated = await autoSeatOwner(activeOrgId, userId);
				}
				if (!seated) {
					throw apiError("FORBIDDEN", context.t("seatRequiredForWrite"));
				}
			} else if (mediaRecord.userId !== userId) {
				throw apiError("FORBIDDEN", context.t("notAttachmentOwner"));
			}

			const attachments = await findAttachmentsByMedia(input.mediaId);

			await deleteMedia(input.mediaId);

			const now = new Date();
			const updatedEntityIds = new Set<string>();
			for (const att of attachments) {
				if (att.entityType === "todo" && !updatedEntityIds.has(att.entityId)) {
					await updateTodo(att.entityId, { updatedAt: now });
					updatedEntityIds.add(att.entityId);
				}
			}

			if (mediaRecord.scopeType === "org" && mediaRecord.organizationId) {
				context.notifyOrgMembers(mediaRecord.organizationId);
			} else {
				context.notifyUser(userId);
			}

			return envelope({ deleted: true });
		}),
};
