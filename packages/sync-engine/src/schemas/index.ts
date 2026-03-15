import { z } from "zod";

export const syncStatusSchema = z.enum(["synced", "pending", "conflict"]);

export const uploadStatusSchema = z.enum([
	"queued",
	"uploading",
	"uploaded",
	"failed",
]);

export const todoSchema = z.object({
	id: z.string(),
	title: z.string(),
	completed: z.boolean(),
	updatedAt: z.string(),
	userId: z.string(),
	organizationId: z.string(),
	createdBy: z.string().nullable(),
	syncStatus: syncStatusSchema,
	deleted: z.boolean(),
});

export const mediaSchema = z.object({
	id: z.string(),
	entityId: z.string().nullable(),
	entityType: z.string().nullable(),
	userId: z.string(),
	url: z.string().nullable(),
	mimeType: z.string(),
	position: z.number(),
	createdAt: z.string(),
});

export const uploadItemSchema = z.object({
	id: z.string(),
	entityType: z.string(),
	entityId: z.string(),
	fileUri: z.string(),
	mimeType: z.string(),
	status: uploadStatusSchema,
	retryCount: z.number(),
	createdAt: z.string(),
});

export const syncInputSchema = z.object({
	changes: z.array(todoSchema),
	lastSyncedAt: z.string().nullable(),
});

export const syncOutputSchema = z.object({
	serverChanges: z.array(todoSchema),
	media: z.array(mediaSchema),
	conflicts: z.array(z.string()),
	syncedAt: z.string(),
});

export type SyncStatus = z.infer<typeof syncStatusSchema>;
export type Todo = z.infer<typeof todoSchema>;
export type Media = z.infer<typeof mediaSchema>;
export type UploadStatus = z.infer<typeof uploadStatusSchema>;
export type UploadItem = z.infer<typeof uploadItemSchema>;
export type SyncInput = z.infer<typeof syncInputSchema>;
export type SyncOutput = z.infer<typeof syncOutputSchema>;
