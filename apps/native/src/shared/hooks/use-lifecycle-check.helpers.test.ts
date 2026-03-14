import { describe, expect, it, vi } from "vitest";

import { ensureActiveOrganizationForSession } from "./use-lifecycle-check.helpers";

describe("ensureActiveOrganizationForSession", () => {
	const lifecycleData = {
		hasOrganization: true,
		hasPendingInvitations: false,
		organizations: [
			{
				id: "org-1",
				name: "Org 1",
				slug: "org-1",
				createdAt: new Date("2026-01-01"),
			},
		],
	};

	it("sets the first organization active when the session is missing one", async () => {
		const authClient = {
			getSession: vi.fn().mockResolvedValue({
				data: { session: { activeOrganizationId: "org-1" } },
			}),
			organization: {
				setActive: vi.fn().mockResolvedValue({}),
			},
		};

		const session = await ensureActiveOrganizationForSession({
			authClient,
			session: { session: { activeOrganizationId: null } },
			lifecycleData,
		});

		expect(authClient.organization.setActive).toHaveBeenCalledWith({
			organizationId: "org-1",
		});
		expect(authClient.getSession).toHaveBeenCalledTimes(1);
		expect(session).toEqual({ session: { activeOrganizationId: "org-1" } });
	});

	it("does not set an organization when one is already active", async () => {
		const authClient = {
			getSession: vi.fn(),
			organization: {
				setActive: vi.fn(),
			},
		};

		const session = await ensureActiveOrganizationForSession({
			authClient,
			session: { session: { activeOrganizationId: "org-2" } },
			lifecycleData,
		});

		expect(authClient.organization.setActive).not.toHaveBeenCalled();
		expect(authClient.getSession).not.toHaveBeenCalled();
		expect(session).toEqual({ session: { activeOrganizationId: "org-2" } });
	});

	it("does not call setActive when the user has no organizations", async () => {
		const authClient = {
			getSession: vi.fn(),
			organization: {
				setActive: vi.fn(),
			},
		};

		const session = await ensureActiveOrganizationForSession({
			authClient,
			session: { session: { activeOrganizationId: null } },
			lifecycleData: {
				...lifecycleData,
				hasOrganization: false,
				organizations: [],
			},
		});

		expect(authClient.organization.setActive).not.toHaveBeenCalled();
		expect(authClient.getSession).not.toHaveBeenCalled();
		expect(session).toEqual({ session: { activeOrganizationId: null } });
	});

	it("throws when setting the active organization fails", async () => {
		const authClient = {
			getSession: vi.fn(),
			organization: {
				setActive: vi
					.fn()
					.mockResolvedValue({ error: { message: "Permission denied" } }),
			},
		};

		await expect(
			ensureActiveOrganizationForSession({
				authClient,
				session: { session: { activeOrganizationId: null } },
				lifecycleData,
			}),
		).rejects.toThrow("Permission denied");
		expect(authClient.getSession).not.toHaveBeenCalled();
	});
});
