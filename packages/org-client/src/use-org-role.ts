import { useActiveMember } from "./use-org-queries";

export function useOrgRole() {
	const { data: activeMember, isPending } = useActiveMember();
	return {
		role: activeMember?.role,
		isOwner: activeMember?.role === "owner",
		isAdmin: activeMember?.role === "admin" || activeMember?.role === "owner",
		isPending,
	};
}
