import type { AuthClientOrg, UserLifecycleData } from "../types";

export type { UserLifecycleData } from "../types";

export async function fetchUserLifecycleData(
	authClient: Pick<AuthClientOrg, "organization">,
): Promise<UserLifecycleData> {
	const [orgs, invitations] = await Promise.all([
		authClient.organization.list(),
		authClient.organization.listUserInvitations(),
	]);
	if (orgs.error) {
		throw new Error(orgs.error.message ?? "Failed to fetch organizations");
	}
	if (invitations.error) {
		throw new Error(invitations.error.message ?? "Failed to fetch invitations");
	}
	const pendingInvitations =
		invitations.data?.filter((inv) => inv.status === "pending") ?? [];
	return {
		hasOrganization: (orgs.data?.length ?? 0) > 0,
		hasPendingInvitations: pendingInvitations.length > 0,
	};
}
