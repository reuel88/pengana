import type { UserLifecycleData } from "@pengana/org-client/lib/user-lifecycle";
import { createContext, useContext } from "react";

type LifecycleContextValue = {
	lifecycleData: UserLifecycleData | null;
	completeOnboarding: () => void;
};

export const LifecycleContext = createContext<LifecycleContextValue>({
	lifecycleData: null,
	completeOnboarding: () => {},
});

export function useLifecycleData() {
	return useContext(LifecycleContext).lifecycleData;
}

export function useCompleteOnboarding() {
	return useContext(LifecycleContext).completeOnboarding;
}
