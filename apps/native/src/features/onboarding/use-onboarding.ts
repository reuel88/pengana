import { useMachine } from "@xstate/react";
import { useRouter } from "expo-router";
import { useEffect } from "react";

import { onboardingMachine } from "./onboarding-machine";

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
