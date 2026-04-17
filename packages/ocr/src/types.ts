export type OcrInput = {
	/** Raw file buffer */
	data: Buffer;
	/** MIME type of the input file */
	mimeType: string;
	/** Optional filename for logging/debugging */
	fileName?: string;
	/** Language hint(s) for Tesseract, defaults to ["eng"] */
	languages?: string[];
};

export type OcrPageResult = {
	/** 1-based page number */
	page: number;
	/** Extracted text for the page */
	text: string;
	/** Overall confidence score 0-100 */
	confidence: number;
};

export type OcrResult = {
	/** All page results, ordered */
	pages: OcrPageResult[];
	/** Concatenated full text across all pages */
	fullText: string;
	/** Average confidence across pages */
	confidence: number;
	/** Input MIME type that was processed */
	inputMimeType: string;
	/** Processing duration in milliseconds */
	durationMs: number;
};

export interface OcrAdapter {
	/** Human-readable adapter name for logging */
	readonly name: string;
	/**
	 * Run OCR on a single image buffer (already preprocessed to PNG/JPEG).
	 * The engine handles multi-page splitting; adapters only see single images.
	 */
	recognizeImage(
		imageBuffer: Buffer,
		options: { languages: string[] },
	): Promise<OcrPageResult>;
	/** Optional cleanup (e.g., terminate Tesseract worker pool) */
	dispose?(): Promise<void>;
}

export type PreprocessedPage = {
	page: number;
	imageBuffer: Buffer;
	/** MIME type of the preprocessed image */
	mimeType: "image/png" | "image/jpeg";
};
