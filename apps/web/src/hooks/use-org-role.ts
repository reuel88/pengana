import { useActiveMember } from "@/hooks/use-org-queries";

export function useOrgRole() {
	const { data: activeMember } = useActiveMember();
	return {
		role: activeMember?.role,
		isOwner: activeMember?.role === "owner",
		isAdmin: activeMember?.role === "admin" || activeMember?.role === "owner",
	};
}
