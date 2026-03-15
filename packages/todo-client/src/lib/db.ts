import type { UploadStatus } from "@pengana/sync-engine";

export interface WebTodo {
	id: string;
	title: string;
	completed: boolean;
	updatedAt: string;
	userId: string;
	syncStatus: "synced" | "pending" | "conflict";
	deleted: boolean;
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
}

export interface WebMedia {
	id: string;
	entityId: string | null;
	entityType: string | null;
	userId: string;
	url: string | null;
	localUri: string | null;
	status: UploadStatus | null;
	mimeType: string;
	position: number;
	createdAt: string;
}
