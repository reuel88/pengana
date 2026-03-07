import { authClient } from "@/lib/auth-client";

export function useOrgRole() {
	const { data: activeMember } = authClient.useActiveMember();
	return {
		role: activeMember?.role,
		isOwner: activeMember?.role === "owner",
		isAdmin: activeMember?.role === "admin" || activeMember?.role === "owner",
	};
}
