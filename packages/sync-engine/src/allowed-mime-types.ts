export const ALLOWED_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/heic",
	"application/pdf",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function isAllowedMimeType(
	mimeType: string,
): mimeType is AllowedMimeType {
	return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}
