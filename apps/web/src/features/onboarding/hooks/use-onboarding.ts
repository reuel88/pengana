import { getInitialStep, onboardingReducer } from "@pengana/org/lib/onboarding";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useReducer } from "react";

export function useOnboarding({
	hasPendingInvitations,
}: {
	hasPendingInvitations: boolean;
}) {
	const navigate = useNavigate();

	const [step, send] = useReducer(
		onboardingReducer,
		hasPendingInvitations,
		getInitialStep,
	);

	useEffect(() => {
		if (step === "complete") {
			navigate({ to: "/" });
		}
	}, [step, navigate]);

	return [step, send] as const;
}
