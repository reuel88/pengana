import {
	fetchUserLifecycleData,
	type UserLifecycleData,
} from "@pengana/org-client/lib/user-lifecycle";
import { useCallback, useEffect, useReducer } from "react";

import { authClient } from "@/shared/lib/auth-client";

import { ensureActiveOrganizationForSession } from "./use-lifecycle-check.helpers";

type State = {
	lifecycleChecked: boolean;
	needsOnboarding: boolean;
	lifecycleData: UserLifecycleData | null;
	orgError: boolean;
};

type Action =
	| { type: "reset" }
	| { type: "success"; data: UserLifecycleData }
	| { type: "error" }
	| { type: "retry" }
	| { type: "onboardingComplete" };

const initialState: State = {
	lifecycleChecked: false,
	needsOnboarding: false,
	lifecycleData: null,
	orgError: false,
};

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "reset":
			return initialState;
		case "success":
			return {
				lifecycleChecked: true,
				needsOnboarding: !action.data.hasOrganization,
				lifecycleData: action.data,
				orgError: false,
			};
		case "error":
			return { ...state, orgError: true, lifecycleChecked: true };
		case "retry":
			return { ...state, orgError: false, lifecycleChecked: false };
		case "onboardingComplete":
			return { ...state, needsOnboarding: false };
	}
}

export function useLifecycleCheck({
	isPending,
	session,
}: {
	isPending: boolean;
	session: unknown;
}) {
	const [state, dispatch] = useReducer(reducer, initialState);

	useEffect(() => {
		if (isPending || !session) {
			dispatch({ type: "reset" });
			return;
		}
		if (state.orgError) return; // hold error UI; don't re-fetch
		if (state.lifecycleChecked) return; // don't re-fetch mid-session

		let cancelled = false;
		(async () => {
			try {
				const data = await fetchUserLifecycleData(authClient);
				await ensureActiveOrganizationForSession({
					authClient,
					session: session as {
						session?: { activeOrganizationId?: string | null } | null;
					},
					lifecycleData: data,
				});
				if (cancelled) return;
				dispatch({ type: "success", data });
			} catch (err) {
				if (!cancelled) {
					console.error("Failed to check org lifecycle:", err);
					dispatch({ type: "error" });
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [isPending, session, state.orgError, state.lifecycleChecked]);

	const retryLifecycleCheck = useCallback(() => {
		dispatch({ type: "retry" });
	}, []);

	const completeOnboarding = useCallback(() => {
		dispatch({ type: "onboardingComplete" });
	}, []);

	return {
		lifecycleChecked: state.lifecycleChecked,
		needsOnboarding: state.needsOnboarding,
		lifecycleData: state.lifecycleData,
		orgError: state.orgError,
		retryLifecycleCheck,
		completeOnboarding,
	};
}
