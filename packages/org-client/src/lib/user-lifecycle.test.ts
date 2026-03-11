import { describe, expect, it, vi } from "vitest";
import { fetchUserLifecycleData } from "./user-lifecycle";

function makeAuthClient(
	orgs: { id: string }[],
	invitations: { status: string }[],
) {
	return {
		organization: {
			list: vi.fn().mockResolvedValue({ data: orgs }),
			listUserInvitations: vi.fn().mockResolvedValue({ data: invitations }),
		},
	};
}

describe("fetchUserLifecycleData", () => {
	it("returns hasOrganization: true when org list is non-empty", async () => {
		const client = makeAuthClient([{ id: "org-1" }], []);
		const result = await fetchUserLifecycleData(client);
		expect(result.hasOrganization).toBe(true);
	});

	it("returns hasOrganization: false when org list is empty", async () => {
		const client = makeAuthClient([], []);
		const result = await fetchUserLifecycleData(client);
		expect(result.hasOrganization).toBe(false);
	});

	it("returns hasPendingInvitations: true when an invitation has status pending", async () => {
		const client = makeAuthClient(
			[],
			[{ status: "accepted" }, { status: "pending" }],
		);
		const result = await fetchUserLifecycleData(client);
		expect(result.hasPendingInvitations).toBe(true);
	});

	it("returns hasPendingInvitations: false when all invitations are non-pending", async () => {
		const client = makeAuthClient(
			[],
			[{ status: "accepted" }, { status: "rejected" }],
		);
		const result = await fetchUserLifecycleData(client);
		expect(result.hasPendingInvitations).toBe(false);
	});

	it("returns hasPendingInvitations: false when invitation list is empty", async () => {
		const client = makeAuthClient([], []);
		const result = await fetchUserLifecycleData(client);
		expect(result.hasPendingInvitations).toBe(false);
	});

	it("fetches orgs and invitations concurrently", async () => {
		const client = makeAuthClient([{ id: "org-1" }], [{ status: "pending" }]);
		await fetchUserLifecycleData(client);
		expect(client.organization.list).toHaveBeenCalledOnce();
		expect(client.organization.listUserInvitations).toHaveBeenCalledOnce();
	});

	it("throws when orgs fetch returns an error", async () => {
		const client = {
			organization: {
				list: vi
					.fn()
					.mockResolvedValue({ error: { message: "Network error" } }),
				listUserInvitations: vi.fn().mockResolvedValue({ data: [] }),
			},
		};
		await expect(fetchUserLifecycleData(client)).rejects.toThrow(
			"Network error",
		);
	});

	it("throws when invitations fetch returns an error", async () => {
		const client = {
			organization: {
				list: vi.fn().mockResolvedValue({ data: [] }),
				listUserInvitations: vi
					.fn()
					.mockResolvedValue({ error: { message: "Forbidden" } }),
			},
		};
		await expect(fetchUserLifecycleData(client)).rejects.toThrow("Forbidden");
	});
});
