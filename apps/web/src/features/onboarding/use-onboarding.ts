import { useNavigate } from "@tanstack/react-router";
import { useMachine } from "@xstate/react";
import { useEffect } from "react";

import { onboardingMachine } from "./onboarding-machine";

export function useOnboarding({
	hasPendingInvitations,
}: {
	hasPendingInvitations: boolean;
}) {
	const navigate = useNavigate();

	const [state, send] = useMachine(onboardingMachine, {
		input: {
			hasPendingInvitations,
		},
	});

	useEffect(() => {
		if (state.matches("complete")) {
			navigate({ to: "/" });
		}
	}, [state, navigate]);

	return [state, send] as const;
}
