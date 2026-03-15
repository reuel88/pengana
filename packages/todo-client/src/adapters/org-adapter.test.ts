import type { Todo } from "@pengana/sync-engine";
import { describe, expect, it, vi } from "vitest";

import type { WebOrgTodo } from "../lib/db";

const { createDexieSyncAdapterMock } = vi.hoisted(() => ({
	createDexieSyncAdapterMock: vi.fn(),
}));

vi.mock("@pengana/entity-store", () => ({
	createDexieSyncAdapter: createDexieSyncAdapterMock,
}));

import { createDexieOrgSyncAdapter } from "./org-adapter";

function getToLocal() {
	createDexieOrgSyncAdapter({} as never, "org-1");
	const [, config] = createDexieSyncAdapterMock.mock.lastCall as [
		string,
		{
			toLocal: (
				wire: Todo,
				existing: WebOrgTodo | undefined,
				syncStatus: "synced" | "conflict",
			) => WebOrgTodo;
		},
	];
	return config.toLocal;
}

describe("createDexieOrgSyncAdapter", () => {
	it("keeps normal wire mapping for synced rows", () => {
		const toLocal = getToLocal();
		const wire = {
			id: "todo-1",
			title: "Server title",
			completed: true,
			updatedAt: "2026-03-14T00:00:00.000Z",
			userId: "org-1",
			syncStatus: "synced",
			deleted: false,
			organizationId: "org-1",
			createdBy: "server-user",
		} as Todo & { organizationId: string; createdBy: string };
		const existing = {
			id: "todo-1",
			title: "Local title",
			completed: false,
			updatedAt: "2026-03-13T00:00:00.000Z",
			userId: "org-1",
			organizationId: "org-1",
			createdBy: "local-user",
			syncStatus: "pending",
			deleted: true,
		} satisfies WebOrgTodo;

		expect(toLocal(wire, existing, "synced")).toEqual({
			id: "todo-1",
			title: "Server title",
			completed: true,
			updatedAt: "2026-03-14T00:00:00.000Z",
			userId: "org-1",
			organizationId: "org-1",
			createdBy: "server-user",
			syncStatus: "synced",
			deleted: false,
		});
	});

	it("preserves local dirty fields for conflict rows", () => {
		const toLocal = getToLocal();
		const wire = {
			id: "todo-1",
			title: "Server title",
			completed: true,
			updatedAt: "2026-03-14T00:00:00.000Z",
			userId: "org-1",
			syncStatus: "synced",
			deleted: false,
			organizationId: "org-1",
			createdBy: "server-user",
		} as Todo & { organizationId: string; createdBy: string };
		const existing = {
			id: "todo-1",
			title: "Local title",
			completed: false,
			updatedAt: "2026-03-13T00:00:00.000Z",
			userId: "org-1",
			organizationId: "org-1",
			createdBy: "local-user",
			syncStatus: "pending",
			deleted: true,
		} satisfies WebOrgTodo;

		expect(toLocal(wire, existing, "conflict")).toEqual({
			id: "todo-1",
			title: "Local title",
			completed: false,
			updatedAt: "2026-03-13T00:00:00.000Z",
			userId: "org-1",
			organizationId: "org-1",
			createdBy: "server-user",
			syncStatus: "conflict",
			deleted: true,
		});
	});

	it("falls back to the wire-mapped row when no local conflict row exists", () => {
		const toLocal = getToLocal();
		const wire = {
			id: "todo-1",
			title: "Server title",
			completed: true,
			updatedAt: "2026-03-14T00:00:00.000Z",
			userId: "org-fallback",
			syncStatus: "synced",
			deleted: false,
		} satisfies Todo;

		expect(toLocal(wire, undefined, "conflict")).toEqual({
			id: "todo-1",
			title: "Server title",
			completed: true,
			updatedAt: "2026-03-14T00:00:00.000Z",
			userId: "org-fallback",
			organizationId: "org-fallback",
			createdBy: null,
			syncStatus: "conflict",
			deleted: false,
		});
	});
});
