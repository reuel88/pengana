import { setup } from "xstate";

export const onboardingMachine = setup({
	types: {
		context: {} as {
			hasPendingInvitations: boolean;
		},
		input: {} as {
			hasPendingInvitations: boolean;
		},
		events: {} as
			| { type: "INVITATION_ACCEPTED" }
			| { type: "SKIP_TO_CREATE" }
			| { type: "ORG_CREATED" }
			| { type: "BACK_TO_CHOICE" }
			| { type: "MEMBERS_INVITED" }
			| { type: "SKIP_INVITE" },
	},
	guards: {
		hasPendingInvitations: ({ context }) => context.hasPendingInvitations,
	},
}).createMachine({
	id: "onboarding",
	initial: "organizationStep",
	context: ({ input }) => ({
		hasPendingInvitations: input.hasPendingInvitations,
	}),
	states: {
		organizationStep: {
			initial: "choice",
			states: {
				choice: {
					always: [
						{
							target: "viewInvitations",
							guard: "hasPendingInvitations",
						},
						{ target: "createOrganization" },
					],
				},
				viewInvitations: {
					on: {
						INVITATION_ACCEPTED: { target: "#onboarding.complete" },
						SKIP_TO_CREATE: { target: "createOrganization" },
					},
				},
				createOrganization: {
					on: {
						ORG_CREATED: { target: "#onboarding.inviteMembers" },
						BACK_TO_CHOICE: {
							target: "viewInvitations",
							guard: "hasPendingInvitations",
						},
					},
				},
			},
		},
		inviteMembers: {
			on: {
				MEMBERS_INVITED: { target: "complete" },
				SKIP_INVITE: { target: "complete" },
			},
		},
		complete: {
			type: "final",
		},
	},
});
