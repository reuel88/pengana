import { onboardingMachine } from "@pengana/org-client/onboarding-machine";
import { useMachine } from "@xstate/react";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export function useOnboarding(hasPendingInvitations: boolean) {
	const router = useRouter();
	const [state, send] = useMachine(onboardingMachine, {
		input: { hasPendingInvitations },
	});

	useEffect(() => {
		if (state.matches("complete")) {
			router.replace("/(drawer)");
		}
	}, [state, router]);

	return { state, send };
}
