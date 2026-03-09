import { describe, expect, it } from "vitest";
import { createActor } from "xstate";
import { onboardingMachine } from "./onboarding-machine";

function startMachine(hasPendingInvitations: boolean) {
	const actor = createActor(onboardingMachine, {
		input: { hasPendingInvitations },
	});
	actor.start();
	return actor;
}

describe("onboardingMachine", () => {
	it("routes to viewInvitations when hasPendingInvitations is true", () => {
		const actor = startMachine(true);
		expect(actor.getSnapshot().value).toEqual({
			organizationStep: "viewInvitations",
		});
	});

	it("routes to createOrganization when hasPendingInvitations is false", () => {
		const actor = startMachine(false);
		expect(actor.getSnapshot().value).toEqual({
			organizationStep: "createOrganization",
		});
	});

	it("INVITATION_ACCEPTED transitions to complete", () => {
		const actor = startMachine(true);
		actor.send({ type: "INVITATION_ACCEPTED" });
		expect(actor.getSnapshot().value).toBe("complete");
	});

	it("SKIP_TO_CREATE transitions from viewInvitations to createOrganization", () => {
		const actor = startMachine(true);
		actor.send({ type: "SKIP_TO_CREATE" });
		expect(actor.getSnapshot().value).toEqual({
			organizationStep: "createOrganization",
		});
	});

	it("ORG_CREATED transitions to inviteMembers", () => {
		const actor = startMachine(false);
		actor.send({ type: "ORG_CREATED" });
		expect(actor.getSnapshot().value).toBe("inviteMembers");
	});

	it("BACK_TO_CHOICE from createOrganization goes to viewInvitations when hasPendingInvitations", () => {
		const actor = startMachine(true);
		actor.send({ type: "SKIP_TO_CREATE" });
		actor.send({ type: "BACK_TO_CHOICE" });
		expect(actor.getSnapshot().value).toEqual({
			organizationStep: "viewInvitations",
		});
	});

	it("BACK_TO_CHOICE has no effect when no pending invitations", () => {
		const actor = startMachine(false);
		actor.send({ type: "BACK_TO_CHOICE" });
		expect(actor.getSnapshot().value).toEqual({
			organizationStep: "createOrganization",
		});
	});

	it("MEMBERS_INVITED transitions from inviteMembers to complete", () => {
		const actor = startMachine(false);
		actor.send({ type: "ORG_CREATED" });
		actor.send({ type: "MEMBERS_INVITED" });
		expect(actor.getSnapshot().value).toBe("complete");
	});

	it("SKIP_INVITE transitions from inviteMembers to complete", () => {
		const actor = startMachine(false);
		actor.send({ type: "ORG_CREATED" });
		actor.send({ type: "SKIP_INVITE" });
		expect(actor.getSnapshot().value).toBe("complete");
	});
});
