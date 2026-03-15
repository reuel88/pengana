import type { Todo } from "@pengana/sync-engine";
import { describe, expect, it, vi } from "vitest";

import type { WebTodo } from "../lib/db";
import { orgTodoConfig } from "../lib/todo-config";

const { createDexieSyncAdapterMock } = vi.hoisted(() => ({
	createDexieSyncAdapterMock: vi.fn(),
}));

vi.mock("@pengana/entity-store", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@pengana/entity-store")>();
	return {
		...actual,
		createDexieSyncAdapter: createDexieSyncAdapterMock,
	};
});

import { createTodoSyncAdapter } from "./adapter";

function getToLocal() {
	createTodoSyncAdapter({} as never, "org-1", orgTodoConfig);
	const [, config] = createDexieSyncAdapterMock.mock.lastCall as [
		string,
		{
			toLocal: (
				wire: Todo,
				existing: WebTodo | undefined,
				syncStatus: "synced" | "conflict",
			) => WebTodo;
		},
	];
	return config.toLocal;
}

describe("createTodoSyncAdapter (org config)", () => {
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
		} satisfies WebTodo;

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
		} satisfies WebTodo;

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
			createdBy: "",
			syncStatus: "conflict",
			deleted: false,
		});
	});
});
