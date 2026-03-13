import type { UploadStatus } from "@pengana/sync-engine";

export interface WebTodo {
	id: string;
	title: string;
	completed: boolean;
	updatedAt: string;
	userId: string;
	syncStatus: "synced" | "pending" | "conflict";
	deleted: boolean;
	attachmentUrl: string | null;
	attachmentLocalUri: string | null;
	attachmentStatus: UploadStatus | null;
}

export interface WebOrgTodo {
	id: string;
	title: string;
	completed: boolean;
	updatedAt: string;
	userId: string; // stores organizationId for sync engine compatibility
	organizationId: string;
	createdBy: string | null;
	syncStatus: "synced" | "pending" | "conflict";
	deleted: boolean;
	attachmentUrl: string | null;
	attachmentLocalUri: string | null;
	attachmentStatus: UploadStatus | null;
}
