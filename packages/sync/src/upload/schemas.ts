import { z } from "zod";

export const uploadStatusSchema = z.enum([
	"queued",
	"uploading",
	"uploaded",
	"failed",
]);

export const uploadItemSchema = z.object({
	id: z.string(),
	fileUri: z.string(),
	mimeType: z.string(),
	entityType: z.string().optional(),
	entityId: z.string().optional(),
	scopeType: z.enum(["personal", "org"]).optional(),
	status: uploadStatusSchema,
	retryCount: z.number(),
	createdAt: z.string(),
});

export type UploadStatus = z.infer<typeof uploadStatusSchema>;
export type UploadItem = z.infer<typeof uploadItemSchema>;
