import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EntityDatabase } from "../../dexie";

const reconcileMediaMock = vi.hoisted(() => vi.fn());

vi.mock("./dexie-media-actions", () => ({
	reconcileMedia: reconcileMediaMock,
}));

import { MediaSyncer, type MediaSyncTransport } from "./media-syncer";

function createFakeTransport(): MediaSyncTransport {
	return {
		sync: vi.fn().mockResolvedValue({
			media: [],
			mediaAttachments: [],
			syncedAt: "2026-03-21T00:00:00Z",
		}),
	};
}

function createFakeDb(lastSyncedAt?: string): EntityDatabase {
	const store = new Map<string, { key: string; value: string }>();
	if (lastSyncedAt) {
		store.set("mediaSyncedAt:scope-1", {
			key: "mediaSyncedAt:scope-1",
			value: lastSyncedAt,
		});
	}

	return {
		syncMeta: {
			get: vi.fn((key: string) => Promise.resolve(store.get(key))),
			put: vi.fn((entry: { key: string; value: string }) => {
				store.set(entry.key, entry);
				return Promise.resolve();
			}),
		},
	} as unknown as EntityDatabase;
}

describe("MediaSyncer", () => {
	beforeEach(() => {
		reconcileMediaMock.mockReset();
	});

	it("passes scopeWideOpts on full sync (no lastSyncedAt)", async () => {
		const transport = createFakeTransport();
		const db = createFakeDb();
		const syncer = new MediaSyncer({
			db,
			scopeId: "scope-1",
			scopeType: "org",
			transport,
		});

		await syncer.sync();

		expect(reconcileMediaMock).toHaveBeenCalledOnce();
		expect(reconcileMediaMock).toHaveBeenCalledWith({
			db,
			serverMedia: [],
			serverAttachments: [],
			scopeWideOpts: { scopeType: "org", scopeId: "scope-1" },
		});
	});

	it("omits scopeWideOpts on incremental sync (has lastSyncedAt)", async () => {
		const transport = createFakeTransport();
		const db = createFakeDb("2026-03-20T00:00:00Z");
		const syncer = new MediaSyncer({
			db,
			scopeId: "scope-1",
			scopeType: "org",
			transport,
		});

		await syncer.sync();

		expect(reconcileMediaMock).toHaveBeenCalledOnce();
		expect(reconcileMediaMock).toHaveBeenCalledWith({
			db,
			serverMedia: [],
			serverAttachments: [],
			scopeWideOpts: undefined,
		});
	});
});
