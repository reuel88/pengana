import type { UserInvitation } from "../types";

export function filterPendingInvitations(
	invitations: UserInvitation[],
): UserInvitation[] {
	return invitations.filter((i) => i.status === "pending");
}
