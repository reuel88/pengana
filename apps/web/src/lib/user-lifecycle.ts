import { authClient } from "./auth-client";

export type UserLifecycleData = {
	hasOrganization: boolean;
	hasPendingInvitations: boolean;
};

export async function fetchUserLifecycleData(): Promise<UserLifecycleData> {
	const [orgs, invitations] = await Promise.all([
		authClient.organization.list(),
		authClient.organization.listUserInvitations(),
	]);
	const pendingInvitations =
		invitations.data?.filter((inv) => inv.status === "pending") ?? [];
	return {
		hasOrganization: (orgs.data?.length ?? 0) > 0,
		hasPendingInvitations: pendingInvitations.length > 0,
	};
}
