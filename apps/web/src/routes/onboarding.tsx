import { fetchUserLifecycleData } from "@pengana/auth/user-lifecycle";
import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { LanguageSwitcher } from "@/components/language-switcher";
import { OnboardingCreateOrg } from "@/features/onboarding/onboarding-create-org";
import { OnboardingInvitations } from "@/features/onboarding/onboarding-invitations";
import { OnboardingInviteMembers } from "@/features/onboarding/onboarding-invite-members";
import { useOnboarding } from "@/features/onboarding/use-onboarding";
import { authClient, requireAuth } from "@/lib/auth-client";

export const Route = createFileRoute("/onboarding")({
	component: OnboardingPage,
	beforeLoad: async () => {
		const { session } = await requireAuth();
		const { hasOrganization, hasPendingInvitations } =
			await fetchUserLifecycleData(authClient);
		if (hasOrganization) {
			throw redirect({ to: "/" });
		}
		return {
			session,
			hasPendingInvitations,
		};
	},
});

function OnboardingPage() {
	const { session, hasPendingInvitations } = Route.useRouteContext();
	const { t } = useTranslation("onboarding");
	const navigate = useNavigate();
	const [state, send] = useOnboarding({ hasPendingInvitations });

	const isViewInvitations = state.matches({
		organizationStep: "viewInvitations",
	});
	const isCreateOrg = state.matches({
		organizationStep: "createOrganization",
	});
	const isInviteMembers = state.matches("inviteMembers");

	return (
		<div className="flex min-h-svh flex-col">
			<div className="flex items-center justify-between border-b px-4 py-2">
				<span className="font-semibold text-lg">pengana</span>
				<div className="flex items-center gap-2">
					<LanguageSwitcher />
					<Button
						variant="ghost"
						size="sm"
						onClick={() =>
							authClient.signOut({
								fetchOptions: {
									onSuccess: () => {
										navigate({ to: "/login" });
									},
								},
							})
						}
					>
						{t("common:user.signOut")}
					</Button>
				</div>
			</div>
			<div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
				<div className="mb-4 text-center">
					<h1 className="font-bold text-2xl">
						{t("title", { name: session.data.user.name })}
					</h1>
					<p className="text-muted-foreground">{t("description")}</p>
				</div>
				{isViewInvitations && (
					<OnboardingInvitations
						onAccepted={() => send({ type: "INVITATION_ACCEPTED" })}
						onSkipToCreate={() => send({ type: "SKIP_TO_CREATE" })}
					/>
				)}
				{isCreateOrg && (
					<OnboardingCreateOrg
						onCreated={() => send({ type: "ORG_CREATED" })}
						onBackToInvitations={
							hasPendingInvitations
								? () => send({ type: "BACK_TO_CHOICE" })
								: undefined
						}
					/>
				)}
				{isInviteMembers && (
					<OnboardingInviteMembers
						onInvited={() => send({ type: "MEMBERS_INVITED" })}
						onSkip={() => send({ type: "SKIP_INVITE" })}
					/>
				)}
			</div>
		</div>
	);
}
