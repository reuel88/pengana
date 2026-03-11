import { onboardingMachine } from "@pengana/org-client/machines/onboarding-machine";
import { useMachine } from "@xstate/react";
import { useRouter } from "expo-router";
import { useEffect } from "react";

import { useCompleteOnboarding } from "@/lib/lifecycle-context";

export function useOnboarding({
	hasPendingInvitations,
}: {
	hasPendingInvitations: boolean;
}) {
	const router = useRouter();
	const completeOnboarding = useCompleteOnboarding();
	const [state, send] = useMachine(onboardingMachine, {
		input: { hasPendingInvitations },
	});

	useEffect(() => {
		if (state.matches("complete")) {
			completeOnboarding();
			router.replace("/(drawer)");
		}
	}, [state, router, completeOnboarding]);

	return [state, send] as const;
}
