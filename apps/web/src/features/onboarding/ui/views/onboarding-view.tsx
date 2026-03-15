import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import { LanguageSwitcher } from "@/features/i18n/language-switcher";
import { useOnboarding } from "@/features/onboarding/hooks/use-onboarding";
import { OnboardingCreateOrg } from "@/features/onboarding/ui/components/onboarding-create-org";
import { OnboardingInvitations } from "@/features/onboarding/ui/components/onboarding-invitations";
import { OnboardingInviteMembers } from "@/features/onboarding/ui/components/onboarding-invite-members";
import { Route } from "@/routes/(account)/onboarding";
import { useSignOut } from "@/shared/hooks/use-sign-out";

export function OnboardingView() {
	const { session, hasPendingInvitations } = Route.useRouteContext();
	const { t } = useTranslation("onboarding");
	const handleSignOut = useSignOut("/login");
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
					<Button variant="ghost" size="sm" onClick={handleSignOut}>
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
