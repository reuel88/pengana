const INVITATION_STORAGE_KEY = "pending-invitation-id";

export function persistPendingInvitation(invitationId?: string | null) {
	if (typeof window === "undefined") return;
	if (invitationId) {
		window.localStorage.setItem(INVITATION_STORAGE_KEY, invitationId);
		return;
	}
	window.localStorage.removeItem(INVITATION_STORAGE_KEY);
}

export function readPendingInvitation() {
	if (typeof window === "undefined") return null;
	return window.localStorage.getItem(INVITATION_STORAGE_KEY);
}

export function consumePendingInvitation() {
	const invitationId = readPendingInvitation();
	persistPendingInvitation(null);
	return invitationId;
}
