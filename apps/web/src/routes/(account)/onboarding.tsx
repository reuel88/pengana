import { fetchUserLifecycleData } from "@pengana/org-client/lib/user-lifecycle";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { OnboardingView } from "@/features/onboarding/ui/views/onboarding-view";
import { authClient, requireAuth } from "@/shared/lib/auth-client";

export const Route = createFileRoute("/(account)/onboarding")({
	component: OnboardingView,
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
