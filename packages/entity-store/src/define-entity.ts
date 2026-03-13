import type { SyncStatus, UploadStatus } from "@pengana/sync-engine";

/** Syncable base fields present on every entity in both Dexie and Drizzle. */
export interface SyncableBase {
	id: string;
	updatedAt: string;
	userId: string;
	syncStatus: SyncStatus;
	deleted: boolean;
}

/** Local-only attachment fields stored in Dexie but never sent to the server. */
export interface AttachmentLocalFields {
	attachmentLocalUri: string | null;
	attachmentStatus: UploadStatus | null;
}

export type EntityScoping = "personal" | "org" | "both";

export interface EntityDefinition {
	/** Unique entity name used as Dexie table name and registry key. */
	name: string;
	/** Dexie index string (e.g. "id, userId, syncStatus, updatedAt"). */
	indexes: string;
	/** Scoping determines how the entity is filtered — by userId, organizationId, or both. */
	scoping: EntityScoping;
}

/**
 * Define a syncable entity.
 *
 * This is a pure data descriptor — no database side effects.
 * It produces a typed descriptor consumed by Dexie and Drizzle layers separately.
 */
export function defineEntity(config: {
	name: string;
	indexes: string;
	scoping: EntityScoping;
}): EntityDefinition {
	return {
		name: config.name,
		indexes: config.indexes,
		scoping: config.scoping,
	};
}
