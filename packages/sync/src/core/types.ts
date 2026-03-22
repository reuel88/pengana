export type {
	Media,
	MediaAttachment,
	SyncInput,
	SyncOutput,
	SyncStatus,
	Todo,
} from "./schemas";

import type { Media, MediaAttachment, Todo } from "./schemas";

export interface SyncAdapter<T extends { id: string } = Todo> {
	getPendingChanges(): Promise<T[]>;
	applyServerChanges(todos: T[], conflictIds?: string[]): Promise<void>;
	markAsSynced(pushedItems: T[]): Promise<void>;
	markAsConflict(ids: string[]): Promise<void>;
	getLastSyncedAt(): Promise<string | null>;
	setLastSyncedAt(timestamp: string): Promise<void>;
}

export interface SyncTransport<T extends { id: string } = Todo> {
	sync(input: {
		changes: T[];
		lastSyncedAt: string | null;
		signal?: AbortSignal;
	}): Promise<{
		serverChanges: T[];
		media?: Media[];
		mediaAttachments?: MediaAttachment[];
		conflicts: string[];
		syncedAt: string;
	}>;
}

export type SyncEventType =
	| "sync:start"
	| "sync:push"
	| "sync:pull"
	| "sync:conflict"
	| "sync:complete"
	| "sync:error";

export interface SyncEvent {
	type: SyncEventType;
	timestamp: string;
	detail: string;
}

/**
 * Pull-only sync adapter for secondary entities (e.g., media).
 * These entities are received from the server but not pushed by the client.
 */
export interface PullSyncAdapter {
	applyServerChanges(
		media: Media[],
		mediaAttachments: MediaAttachment[],
		entityIds: string[],
	): Promise<void>;
}

/** Configuration for secondary (pull-only) adapters attached to the SyncEngine. */
export interface SecondaryAdapters {
	media?: PullSyncAdapter;
}
