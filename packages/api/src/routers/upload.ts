import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
	countMediaByEntityId,
	deleteMedia,
	findMediaById,
	insertMedia,
	updateMediaUrl,
} from "@pengana/db/media-queries";
import { findOrgTodoById, updateOrgTodo } from "@pengana/db/org-todo-queries";
import {
	autoSeatOwner,
	isMemberSeatedByUserId,
} from "@pengana/db/seat-queries";
import { findTodoById, updateTodo } from "@pengana/db/todo-queries";
import {
	ALLOWED_MIME_TYPES,
	MAX_FILE_SIZE_BYTES,
	MIME_TO_EXT,
} from "@pengana/sync-engine";
import { z } from "zod";

import { apiError } from "../errors";
import { envelope, envelopeOutput, protectedProcedure } from "../index";

const UPLOADS_DIR = join(process.cwd(), "uploads");
const MAX_ATTACHMENTS = 10;

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

			if (input.entityType === "orgTodo") {
				if (!activeOrgId) {
					throw apiError("BAD_REQUEST", context.t("noActiveOrganization"));
				}
				const orgId = activeOrgId;

				const orgTodo = await findOrgTodoById(input.entityId);
				if (!orgTodo || orgTodo.organizationId !== orgId) {
					throw apiError("NOT_FOUND", context.t("todoNotFound"));
				}

				let seated = await isMemberSeatedByUserId(orgId, userId);
				if (!seated) {
					seated = await autoSeatOwner(orgId, userId);
				}

				if (!seated) {
					throw apiError("FORBIDDEN", context.t("seatRequiredForWrite"));
				}
			} else {
				const todo = await findTodoById(input.entityId);
				if (!todo || todo.userId !== userId) {
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

			await insertMedia({
				id: input.attachmentId,
				entityId: input.entityId,
				entityType: input.entityType,
				userId,
				url,
				mimeType: input.mimeType,
				position: count,
			}).catch(async () => {
				await updateMediaUrl(input.attachmentId, url);
			});

			const now = new Date();
			if (input.entityType === "orgTodo") {
				await updateOrgTodo(input.entityId, { updatedAt: now });
				if (!activeOrgId) {
					throw apiError("BAD_REQUEST", context.t("noActiveOrganization"));
				}
				context.notifyOrgMembers(activeOrgId);
			} else {
				await updateTodo(input.entityId, { updatedAt: now });
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
		.handler(async ({ input }) => {
			const mediaRecord = await findMediaById(input.attachmentId);
			await deleteMedia(input.attachmentId);

			// Bump the parent entity's updatedAt so other clients pick up the change on sync
			if (mediaRecord?.entityId) {
				const now = new Date();
				if (mediaRecord.entityType === "org-todo") {
					await updateOrgTodo(mediaRecord.entityId, { updatedAt: now });
				} else {
					await updateTodo(mediaRecord.entityId, { updatedAt: now });
				}
			}

			return envelope({ deleted: true });
		}),
};
