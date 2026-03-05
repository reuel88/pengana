import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ORPCError } from "@orpc/server";
import { findTodoById } from "@pengana/db/todo-queries";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@pengana/sync-engine";
import { z } from "zod";

import { protectedProcedure } from "../index";

const UPLOADS_DIR = join(process.cwd(), "uploads");

const MIME_TO_EXT: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/heic": "heic",
	"application/pdf": "pdf",
};

export const uploadRouter = {
	upload: protectedProcedure
		.input(
			z.object({
				todoId: z.string(),
				fileName: z.string(),
				mimeType: z.enum(ALLOWED_MIME_TYPES),
				data: z.string(),
				idempotencyKey: z.string().uuid(),
			}),
		)
		.handler(async ({ input, context }) => {
			const userId = context.session.user.id;

			const todo = await findTodoById(input.todoId);
			if (!todo || todo.userId !== userId) {
				throw new ORPCError("NOT_FOUND", {
					message: "Todo not found",
				});
			}

			const buffer = Buffer.from(input.data, "base64");

			if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
				throw new ORPCError("BAD_REQUEST", {
					message: "File exceeds maximum size of 10MB",
				});
			}

			await mkdir(UPLOADS_DIR, { recursive: true });

			const ext = MIME_TO_EXT[input.mimeType] ?? "bin";
			const filename = `${input.idempotencyKey}.${ext}`;
			const filepath = join(UPLOADS_DIR, filename);

			try {
				await access(filepath);
				return {
					attachmentUrl: `/uploads/${filename}`,
				};
			} catch {
				// File doesn't exist, proceed with writing
			}

			await writeFile(filepath, buffer);

			return {
				attachmentUrl: `/uploads/${filename}`,
			};
		}),
};
