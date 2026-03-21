import type { EntityDatabase } from "@pengana/entity-store";
import type { Media, MediaAttachment } from "@pengana/sync/core";

import { reconcileMedia } from "./dexie-media-actions";

export interface MediaSyncTransport {
	sync(input: { lastSyncedAt: string | null }): Promise<{
		media: Media[];
		mediaAttachments: MediaAttachment[];
		syncedAt: string;
	}>;
}

export interface MediaSyncerOptions {
	db: EntityDatabase;
	scopeId: string;
	scopeType: "personal" | "org";
	transport: MediaSyncTransport;
}

const SYNC_KEY_PREFIX = "mediaSyncedAt";

export class MediaSyncer {
	private db: EntityDatabase;
	private scopeId: string;
	private scopeType: "personal" | "org";
	private transport: MediaSyncTransport;
	private syncing = false;

	constructor(options: MediaSyncerOptions) {
		this.db = options.db;
		this.scopeId = options.scopeId;
		this.scopeType = options.scopeType;
		this.transport = options.transport;
	}

	async sync(): Promise<void> {
		if (this.syncing) return;
		this.syncing = true;
		try {
			const lastSyncedAt = await this.getLastSyncedAt();
			const isFullSync = lastSyncedAt === null;
			const result = await this.transport.sync({ lastSyncedAt });

			await reconcileMedia({
				db: this.db,
				serverMedia: result.media,
				serverAttachments: result.mediaAttachments,
				scopeWideOpts: isFullSync
					? { scopeType: this.scopeType, scopeId: this.scopeId }
					: undefined,
			});

			await this.setLastSyncedAt(result.syncedAt);
		} finally {
			this.syncing = false;
		}
	}

	private async getLastSyncedAt(): Promise<string | null> {
		const key = `${SYNC_KEY_PREFIX}:${this.scopeId}`;
		const meta = await this.db.syncMeta.get(key);
		return meta?.value ?? null;
	}

	private async setLastSyncedAt(timestamp: string): Promise<void> {
		const key = `${SYNC_KEY_PREFIX}:${this.scopeId}`;
		await this.db.syncMeta.put({ key, value: timestamp });
	}
}
