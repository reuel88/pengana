import * as mupdf from "mupdf";
import type { OcrPageResult, PreprocessedPage } from "../types";

export type PdfPreprocessOptions = {
	/** Rendering DPI, defaults to 300 */
	dpi?: number;
	/** Maximum number of pages to process, defaults to 50 */
	maxPages?: number;
};

export type PdfTextResult = {
	pages: OcrPageResult[];
	fullText: string;
};

/**
 * Attempts to extract embedded text directly from a digital PDF.
 * Returns null if the PDF appears to be scanned (insufficient text).
 */
export function extractPdfText(
	data: Buffer,
	maxPages = 50,
): PdfTextResult | null {
	try {
		const doc = mupdf.Document.openDocument(data, "application/pdf");
		const pageCount = Math.min(doc.countPages(), maxPages);
		const pages: OcrPageResult[] = [];

		for (let i = 0; i < pageCount; i++) {
			const page = doc.loadPage(i);
			const stext = page.toStructuredText("preserve-whitespace");
			const text = stext.asText();
			pages.push({ page: i + 1, text, confidence: 100 });
		}

		const fullText = pages.map((p) => p.text).join("\n\n");

		// Heuristic: if text is too short or too few words, it's likely scanned
		const wordCount = fullText.split(/\s+/).filter(Boolean).length;
		if (fullText.length < 50 || wordCount < 10) {
			return null;
		}

		return { pages, fullText };
	} catch {
		return null;
	}
}

/**
 * Renders PDF pages to PNG images for OCR processing.
 * Uses MuPDF (WASM) for server-side rendering — no native dependencies.
 */
export async function preprocessPdf(
	data: Buffer,
	options?: PdfPreprocessOptions,
): Promise<PreprocessedPage[]> {
	const dpi = options?.dpi ?? 300;
	const maxPages = options?.maxPages ?? 50;
	const scale = dpi / 72;

	const doc = mupdf.Document.openDocument(data, "application/pdf");
	const pageCount = Math.min(doc.countPages(), maxPages);
	const pages: PreprocessedPage[] = [];

	for (let i = 0; i < pageCount; i++) {
		const page = doc.loadPage(i);
		const pixmap = page.toPixmap(
			mupdf.Matrix.scale(scale, scale),
			mupdf.ColorSpace.DeviceRGB,
		);
		const pngBuffer = pixmap.asPNG();

		pages.push({
			page: i + 1,
			imageBuffer: Buffer.from(pngBuffer),
			mimeType: "image/png",
		});
	}

	return pages;
}
