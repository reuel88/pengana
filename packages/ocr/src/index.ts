export { TesseractJsAdapter } from "./adapters/tesseract-js.adapter";
export { createOcrEngine, type OcrEngineOptions, runOcr } from "./ocr-engine";
export type {
	OcrAdapter,
	OcrInput,
	OcrPageResult,
	OcrResult,
	PreprocessedPage,
} from "./types";
export {
	isSupportedMimeType,
	OCR_SUPPORTED_MIME_TYPES,
	type OcrSupportedMimeType,
} from "./utils/mime";
