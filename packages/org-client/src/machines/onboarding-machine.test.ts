import { describe, expect, it } from "vitest";
import { getInitialStep, onboardingReducer } from "./onboarding-machine";

describe("onboardingReducer", () => {
	it("routes to viewInvitations when hasPendingInvitations is true", () => {
		expect(getInitialStep(true)).toBe("viewInvitations");
	});

	it("routes to createOrganization when hasPendingInvitations is false", () => {
		expect(getInitialStep(false)).toBe("createOrganization");
	});

	it("INVITATION_ACCEPTED transitions to complete", () => {
		const result = onboardingReducer("viewInvitations", {
			type: "INVITATION_ACCEPTED",
		});
		expect(result).toBe("complete");
	});

	it("SKIP_TO_CREATE transitions from viewInvitations to createOrganization", () => {
		const result = onboardingReducer("viewInvitations", {
			type: "SKIP_TO_CREATE",
		});
		expect(result).toBe("createOrganization");
	});

	it("ORG_CREATED transitions to inviteMembers", () => {
		const result = onboardingReducer("createOrganization", {
			type: "ORG_CREATED",
		});
		expect(result).toBe("inviteMembers");
	});

	it("BACK_TO_CHOICE from createOrganization goes to viewInvitations", () => {
		let step = getInitialStep(true);
		step = onboardingReducer(step, { type: "SKIP_TO_CREATE" });
		step = onboardingReducer(step, { type: "BACK_TO_CHOICE" });
		expect(step).toBe("viewInvitations");
	});

	it("BACK_TO_CHOICE has no effect when already in viewInvitations", () => {
		const result = onboardingReducer("createOrganization", {
			type: "BACK_TO_CHOICE",
		});
		expect(result).toBe("viewInvitations");
	});

	it("MEMBERS_INVITED transitions from inviteMembers to complete", () => {
		let step = getInitialStep(false);
		step = onboardingReducer(step, { type: "ORG_CREATED" });
		step = onboardingReducer(step, { type: "MEMBERS_INVITED" });
		expect(step).toBe("complete");
	});

	it("SKIP_INVITE transitions from inviteMembers to complete", () => {
		let step = getInitialStep(false);
		step = onboardingReducer(step, { type: "ORG_CREATED" });
		step = onboardingReducer(step, { type: "SKIP_INVITE" });
		expect(step).toBe("complete");
	});
});
