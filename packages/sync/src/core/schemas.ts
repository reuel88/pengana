import { z } from "zod";

export const syncStatusSchema = z.enum(["synced", "pending", "conflict"]);

export const fieldClocksSchema = z.record(z.string(), z.string());

export const todoSchema = z.object({
	id: z.string(),
	title: z.string(),
	completed: z.boolean(),
	updatedAt: z.string(),
	hlcTimestamp: z.string(),
	fieldClocks: fieldClocksSchema,
	userId: z.string(),
	organizationId: z.string(),
	createdBy: z.string(),
	syncStatus: syncStatusSchema,
	deleted: z.boolean(),
});

export const mediaSchema = z.object({
	id: z.string(),
	userId: z.string(),
	url: z.string().nullable(),
	mimeType: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
	scopeType: z.enum(["personal", "org"]),
	scopeId: z.string(),
	organizationId: z.string(),
	createdBy: z.string(),
	deletedAt: z.string().nullable(),
});

export const mediaAttachmentSchema = z.object({
	id: z.string(),
	mediaId: z.string(),
	entityType: z.string(),
	entityId: z.string(),
	position: z.number(),
	createdAt: z.string(),
});

export const syncInputSchema = z.object({
	changes: z.array(todoSchema),
	lastSyncedAt: z.iso.datetime().nullable(),
});

export const syncOutputSchema = z.object({
	serverChanges: z.array(todoSchema),
	media: z.array(mediaSchema),
	mediaAttachments: z.array(mediaAttachmentSchema),
	conflicts: z.array(z.string()),
	syncedAt: z.string(),
});

export type SyncStatus = z.infer<typeof syncStatusSchema>;
export type Todo = z.infer<typeof todoSchema>;
export type Media = z.infer<typeof mediaSchema>;
export type MediaAttachment = z.infer<typeof mediaAttachmentSchema>;
export type SyncInput = z.infer<typeof syncInputSchema>;
export type SyncOutput = z.infer<typeof syncOutputSchema>;
