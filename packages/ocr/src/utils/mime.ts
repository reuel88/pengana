export const OCR_SUPPORTED_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/heic",
	"image/tiff",
	"application/pdf",
] as const;

export type OcrSupportedMimeType = (typeof OCR_SUPPORTED_MIME_TYPES)[number];

export function isSupportedMimeType(
	mimeType: string,
): mimeType is OcrSupportedMimeType {
	return (OCR_SUPPORTED_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function isPdfMimeType(mimeType: string): boolean {
	return mimeType === "application/pdf";
}

export function isImageMimeType(mimeType: string): boolean {
	return mimeType.startsWith("image/");
}
