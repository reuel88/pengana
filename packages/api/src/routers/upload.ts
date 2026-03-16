import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
	countMediaByEntityId,
	deleteMedia,
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
	ENTITY_TYPE_TODO,
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
			summary: "Upload a file attachment",
		})
		.input(
			z.object({
				entityType: z.string(),
				entityId: z.string(),
				fileName: z.string(),
				mimeType: z.enum(ALLOWED_MIME_TYPES),
				data: z.string(),
				idempotencyKey: z.string().uuid(),
				attachmentId: z.string().uuid(),
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

			const todoRow = await findTodoById(input.entityId);
			if (!todoRow) {
				throw apiError("NOT_FOUND", context.t("todoNotFound"));
			}

			if (todoRow.scopeType === "org") {
				if (!activeOrgId) {
					throw apiError("BAD_REQUEST", context.t("noActiveOrganization"));
				}
				if (todoRow.scopeId !== activeOrgId) {
					throw apiError("NOT_FOUND", context.t("todoNotFound"));
				}

				let seated = await isMemberSeatedByUserId(activeOrgId, userId);
				if (!seated) {
					seated = await autoSeatOwner(activeOrgId, userId);
				}

				if (!seated) {
					throw apiError("FORBIDDEN", context.t("seatRequiredForWrite"));
				}
			} else {
				if (todoRow.userId !== userId) {
					throw apiError("NOT_FOUND", context.t("todoNotFound"));
				}
			}

			const count = await countMediaByEntityId(input.entityId);
			if (count >= MAX_ATTACHMENTS) {
				throw apiError("BAD_REQUEST", context.t("tooManyAttachments"));
			}

			const buffer = Buffer.from(input.data, "base64");

			if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
				throw apiError("BAD_REQUEST", context.t("fileTooLarge"));
			}

			const existingMedia = await findMediaById(input.attachmentId);
			if (existingMedia && existingMedia.userId !== userId) {
				throw apiError(
					"FORBIDDEN",
					context.t("attachmentBelongsToAnotherUser"),
				);
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

			const now = new Date();

			await insertMedia({
				id: input.attachmentId,
				entityId: input.entityId,
				entityType: ENTITY_TYPE_TODO,
				userId,
				url,
				mimeType: input.mimeType,
				position: count,
				scopeType: todoRow.scopeType,
				scopeId: todoRow.scopeId,
				organizationId: todoRow.organizationId,
				createdBy: userId,
				updatedAt: now,
			});

			await updateTodo(input.entityId, { updatedAt: now });

			if (todoRow.scopeType === "org" && activeOrgId) {
				context.notifyOrgMembers(activeOrgId);
			} else {
				context.notifyUser(userId);
			}

			return envelope({
				url,
				mediaId: input.attachmentId,
			});
		}),

	deleteAttachment: protectedProcedure
		.route({
			method: "POST",
			path: "/delete-attachment",
			summary: "Delete a file attachment",
		})
		.input(
			z.object({
				attachmentId: z.string().uuid(),
			}),
		)
		.output(envelopeOutput(z.object({ deleted: z.boolean() })))
		.handler(async ({ input, context }) => {
			const userId = context.session.user.id;
			const mediaRecord = await findMediaById(input.attachmentId);

			if (!mediaRecord) {
				throw apiError("NOT_FOUND", context.t("attachmentNotFound"));
			}

			if (mediaRecord.scopeType === "org") {
				const activeOrgId = context.session.session.activeOrganizationId;
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

			await deleteMedia(input.attachmentId);

			if (mediaRecord.entityId) {
				const now = new Date();
				await updateTodo(mediaRecord.entityId, { updatedAt: now });
			}

			if (mediaRecord.scopeType === "org" && mediaRecord.organizationId) {
				context.notifyOrgMembers(mediaRecord.organizationId);
			} else {
				context.notifyUser(userId);
			}

			return envelope({ deleted: true });
		}),
};
