import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { findOrgTodoById } from "@pengana/db/org-todo-queries";
import { findTodoById } from "@pengana/db/todo-queries";
import {
	ALLOWED_MIME_TYPES,
	MAX_FILE_SIZE_BYTES,
	MIME_TO_EXT,
} from "@pengana/sync-engine";
import { z } from "zod";

import { apiError } from "../errors";
import { envelope, envelopeOutput, seatedProcedure } from "../index";

const UPLOADS_DIR = join(process.cwd(), "uploads");

export const uploadRouter = {
	upload: seatedProcedure
		.route({
			method: "POST",
			path: "/upload",
			summary: "Upload a file attachment",
		})
		.input(
			z.object({
				todoId: z.string(),
				fileName: z.string(),
				mimeType: z.enum(ALLOWED_MIME_TYPES),
				data: z.string(),
				idempotencyKey: z.string().uuid(),
			}),
		)
		.output(envelopeOutput(z.object({ attachmentUrl: z.string() })))
		.handler(async ({ input, context }) => {
			const userId = context.session.user.id;

			const todo = await findTodoById(input.todoId);
			if (todo && todo.userId !== userId) {
				throw apiError("NOT_FOUND", context.t("todoNotFound"));
			}

			if (!todo) {
				const orgTodo = await findOrgTodoById(input.todoId);
				if (
					!orgTodo ||
					orgTodo.organizationId !==
						context.session.session.activeOrganizationId
				) {
					throw apiError("NOT_FOUND", context.t("todoNotFound"));
				}
			}

			const buffer = Buffer.from(input.data, "base64");

			if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
				throw apiError("BAD_REQUEST", context.t("fileTooLarge"));
			}

			await mkdir(UPLOADS_DIR, { recursive: true });

			const ext = MIME_TO_EXT[input.mimeType] ?? "bin";
			const filename = `${input.idempotencyKey}.${ext}`;
			const filepath = join(UPLOADS_DIR, filename);

			try {
				await access(filepath);
				return envelope({
					attachmentUrl: `/uploads/${filename}`,
				});
			} catch (err) {
				if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
				// File doesn't exist, proceed with writing
			}

			await writeFile(filepath, buffer);

			return envelope({
				attachmentUrl: `/uploads/${filename}`,
			});
		}),
};
