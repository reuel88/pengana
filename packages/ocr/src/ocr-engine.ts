import { preprocessImage } from "./preprocessing/image-preprocessor";
import {
	extractPdfText,
	preprocessPdf,
} from "./preprocessing/pdf-preprocessor";
import type {
	OcrAdapter,
	OcrInput,
	OcrResult,
	PreprocessedPage,
} from "./types";
import {
	isImageMimeType,
	isPdfMimeType,
	isSupportedMimeType,
} from "./utils/mime";

export type OcrEngineOptions = {
	adapter: OcrAdapter;
	/** Enable image enhancements (grayscale, contrast) for better accuracy */
	enhance?: boolean;
	/** Max pages to process from multi-page documents (default: 50) */
	maxPages?: number;
};

/**
 * Runs OCR on the given input by routing to the correct preprocessor,
 * then dispatching each page to the adapter.
 */
export async function runOcr(
	input: OcrInput,
	options: OcrEngineOptions,
): Promise<OcrResult> {
	const start = Date.now();
	const languages = input.languages ?? ["eng"];

	if (!isSupportedMimeType(input.mimeType)) {
		throw new Error(`Unsupported MIME type for OCR: ${input.mimeType}`);
	}

	// For PDFs, try direct text extraction first (faster + better for digital PDFs)
	if (isPdfMimeType(input.mimeType)) {
		const directText = extractPdfText(input.data, options.maxPages ?? 50);
		if (directText) {
			return {
				pages: directText.pages,
				fullText: directText.fullText,
				confidence: 100,
				inputMimeType: input.mimeType,
				durationMs: Date.now() - start,
			};
		}
	}

	let pages: PreprocessedPage[];

	if (isPdfMimeType(input.mimeType)) {
		pages = await preprocessPdf(input.data, {
			dpi: 300,
			maxPages: options.maxPages ?? 50,
		});
	} else if (isImageMimeType(input.mimeType)) {
		pages = await preprocessImage(input.data, input.mimeType, {
			enhance: options.enhance,
		});
	} else {
		throw new Error(`Unsupported MIME type for OCR: ${input.mimeType}`);
	}

	const results = await Promise.all(
		pages.map(async (page) => {
			const result = await options.adapter.recognizeImage(page.imageBuffer, {
				languages,
			});
			return { ...result, page: page.page };
		}),
	);

	const fullText = results.map((r) => r.text).join("\n\n");
	const avgConfidence =
		results.length > 0
			? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
			: 0;

	return {
		pages: results,
		fullText,
		confidence: Math.round(avgConfidence * 100) / 100,
		inputMimeType: input.mimeType,
		durationMs: Date.now() - start,
	};
}

/**
 * Creates a reusable OCR engine instance with the given options.
 */
export function createOcrEngine(options: OcrEngineOptions) {
	return {
		recognize: (input: OcrInput) => runOcr(input, options),
		dispose: () => options.adapter.dispose?.() ?? Promise.resolve(),
	};
}
