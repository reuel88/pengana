import sharp from "sharp";
import type { PreprocessedPage } from "../types";

export type ImagePreprocessOptions = {
	/** Apply grayscale + contrast normalization for better OCR accuracy */
	enhance?: boolean;
};

/**
 * Preprocesses an image buffer into OCR-ready PNG pages.
 * Handles HEIC, TIFF (multi-page), JPEG, PNG conversion and optional enhancement.
 */
export async function preprocessImage(
	data: Buffer,
	mimeType: string,
	options?: ImagePreprocessOptions,
): Promise<PreprocessedPage[]> {
	if (mimeType === "image/tiff") {
		return preprocessMultiPageTiff(data, options);
	}

	const buffer = await processImageBuffer(data, options);
	return [{ page: 1, imageBuffer: buffer, mimeType: "image/png" }];
}

async function preprocessMultiPageTiff(
	data: Buffer,
	options?: ImagePreprocessOptions,
): Promise<PreprocessedPage[]> {
	const metadata = await sharp(data).metadata();
	const pageCount = metadata.pages ?? 1;
	const pages: PreprocessedPage[] = [];

	for (let i = 0; i < pageCount; i++) {
		const buffer = await processImageBuffer(data, options, i);
		pages.push({ page: i + 1, imageBuffer: buffer, mimeType: "image/png" });
	}

	return pages;
}

async function processImageBuffer(
	data: Buffer,
	options?: ImagePreprocessOptions,
	page?: number,
): Promise<Buffer> {
	let pipeline = page !== undefined ? sharp(data, { page }) : sharp(data);

	if (options?.enhance) {
		pipeline = pipeline.grayscale().normalize();
	}

	return pipeline.png().toBuffer();
}
