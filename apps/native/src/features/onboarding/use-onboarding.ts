import { getInitialStep, onboardingReducer } from "@pengana/org/lib/onboarding";
import { useRouter } from "expo-router";
import { useEffect, useReducer } from "react";

import { useCompleteOnboarding } from "@/shared/lib/lifecycle-context";

export function useOnboarding({
	hasPendingInvitations,
}: {
	hasPendingInvitations: boolean;
}) {
	const router = useRouter();
	const completeOnboarding = useCompleteOnboarding();
	const [step, send] = useReducer(
		onboardingReducer,
		hasPendingInvitations,
		getInitialStep,
	);

	useEffect(() => {
		if (step === "complete") {
			completeOnboarding();
			router.replace("/(drawer)");
		}
	}, [step, router, completeOnboarding]);

	return [step, send] as const;
}
