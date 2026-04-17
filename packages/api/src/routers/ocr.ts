import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { findMediaById } from "@pengana/db/media-queries";
import { env } from "@pengana/env/server";
import { extractFinancialData } from "@pengana/extraction";
import {
	createOcrEngine,
	OCR_SUPPORTED_MIME_TYPES,
	TesseractJsAdapter,
} from "@pengana/ocr";
import { z } from "zod";

import { apiError } from "../errors";
import { envelope, envelopeOutput, protectedProcedure } from "../index";

const UPLOADS_DIR = join(process.cwd(), "uploads");

let engine: ReturnType<typeof createOcrEngine> | null = null;
function getEngine() {
	if (!engine) {
		engine = createOcrEngine({
			adapter: new TesseractJsAdapter(),
			enhance: true,
		});
	}
	return engine;
}

export const ocrRouter = {
	recognize: protectedProcedure
		.route({
			method: "POST",
			path: "/ocr/recognize",
			summary: "Extract text from an uploaded document via OCR",
		})
		.input(
			z.object({
				mediaId: z.string().uuid(),
				languages: z.array(z.string()).optional(),
				maxPages: z.number().int().min(1).max(100).optional(),
			}),
		)
		.output(
			envelopeOutput(
				z.object({
					fullText: z.string(),
					confidence: z.number(),
					pageCount: z.number(),
					durationMs: z.number(),
					pages: z.array(
						z.object({
							page: z.number(),
							text: z.string(),
							confidence: z.number(),
						}),
					),
				}),
			),
		)
		.handler(async ({ input, context }) => {
			const userId = context.session.user.id;
			const media = await findMediaById(input.mediaId);

			if (!media || media.userId !== userId) {
				throw apiError("NOT_FOUND", context.t("attachmentNotFound"));
			}

			if (
				!(OCR_SUPPORTED_MIME_TYPES as readonly string[]).includes(
					media.mimeType,
				)
			) {
				throw apiError("BAD_REQUEST", "Unsupported file type for OCR");
			}

			const filename = media.url?.replace(/^\/uploads\//, "");
			if (!filename) {
				throw apiError("NOT_FOUND", "Media file not available");
			}

			const filepath = join(UPLOADS_DIR, filename);
			const data = await readFile(filepath);

			const result = await getEngine().recognize({
				data,
				mimeType: media.mimeType,
				languages: input.languages,
			});

			return envelope({
				fullText: result.fullText,
				confidence: result.confidence,
				pageCount: result.pages.length,
				durationMs: result.durationMs,
				pages: result.pages,
			});
		}),

	extract: protectedProcedure
		.route({
			method: "POST",
			path: "/ocr/extract",
			summary: "OCR and extract structured financial data from a document",
		})
		.input(
			z.object({
				mediaId: z.string().uuid(),
				languages: z.array(z.string()).optional(),
				forceLlm: z.boolean().optional(),
				skipLlm: z.boolean().optional(),
			}),
		)
		.output(
			envelopeOutput(
				z.object({
					ocr: z.object({
						fullText: z.string(),
						confidence: z.number(),
						pageCount: z.number(),
						durationMs: z.number(),
					}),
					extraction: z.object({
						document: z.object({
							documentType: z.enum([
								"invoice",
								"receipt",
								"statement",
								"other",
							]),
							vendor: z.string().nullable(),
							date: z.string().nullable(),
							dueDate: z.string().nullable(),
							referenceNumber: z.string().nullable(),
							lineItems: z.array(
								z.object({
									description: z.string(),
									quantity: z.number().nullable(),
									unitPrice: z.number().nullable(),
									amount: z.number(),
								}),
							),
							subtotal: z.number().nullable(),
							taxAmount: z.number().nullable(),
							total: z.number().nullable(),
							currency: z.string().nullable(),
							notes: z.string().nullable(),
						}),
						method: z.enum(["regex", "llm", "hybrid"]),
						coverage: z.number(),
						durationMs: z.number(),
					}),
				}),
			),
		)
		.handler(async ({ input, context }) => {
			const userId = context.session.user.id;
			const media = await findMediaById(input.mediaId);

			if (!media || media.userId !== userId) {
				throw apiError("NOT_FOUND", context.t("attachmentNotFound"));
			}

			if (
				!(OCR_SUPPORTED_MIME_TYPES as readonly string[]).includes(
					media.mimeType,
				)
			) {
				throw apiError("BAD_REQUEST", "Unsupported file type for OCR");
			}

			const filename = media.url?.replace(/^\/uploads\//, "");
			if (!filename) {
				throw apiError("NOT_FOUND", "Media file not available");
			}

			const filepath = join(UPLOADS_DIR, filename);
			const data = await readFile(filepath);

			const ocrResult = await getEngine().recognize({
				data,
				mimeType: media.mimeType,
				languages: input.languages,
			});

			const extraction = await extractFinancialData(ocrResult.fullText, {
				anthropicApiKey: env.ANTHROPIC_API_KEY,
				forceLlm: input.forceLlm,
				skipLlm: input.skipLlm,
			});

			return envelope({
				ocr: {
					fullText: ocrResult.fullText,
					confidence: ocrResult.confidence,
					pageCount: ocrResult.pages.length,
					durationMs: ocrResult.durationMs,
				},
				extraction,
			});
		}),
};
