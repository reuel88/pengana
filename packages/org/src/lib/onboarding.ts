export type OnboardingStep =
	| "viewInvitations"
	| "createOrganization"
	| "inviteMembers"
	| "complete";

export type OnboardingEvent =
	| { type: "INVITATION_ACCEPTED" }
	| { type: "SKIP_TO_CREATE" }
	| { type: "ORG_CREATED" }
	| { type: "BACK_TO_CHOICE" }
	| { type: "MEMBERS_INVITED" }
	| { type: "SKIP_INVITE" };

export function getInitialStep(hasPendingInvitations: boolean): OnboardingStep {
	return hasPendingInvitations ? "viewInvitations" : "createOrganization";
}

export function onboardingReducer(
	state: OnboardingStep,
	event: OnboardingEvent,
): OnboardingStep {
	switch (state) {
		case "viewInvitations":
			if (event.type === "INVITATION_ACCEPTED") return "complete";
			if (event.type === "SKIP_TO_CREATE") return "createOrganization";
			return state;
		case "createOrganization":
			if (event.type === "ORG_CREATED") return "inviteMembers";
			if (event.type === "BACK_TO_CHOICE") return "viewInvitations";
			return state;
		case "inviteMembers":
			if (event.type === "MEMBERS_INVITED") return "complete";
			if (event.type === "SKIP_INVITE") return "complete";
			return state;
		default:
			return state;
	}
}
