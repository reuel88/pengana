import {
	fetchUserLifecycleData,
	type UserLifecycleData,
} from "@pengana/org-client/lib/user-lifecycle";
import { useCallback, useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

export function useLifecycleCheck({
	isPending,
	session,
}: {
	isPending: boolean;
	session: unknown;
}) {
	const [lifecycleChecked, setLifecycleChecked] = useState(false);
	const [needsOnboarding, setNeedsOnboarding] = useState(false);
	const [lifecycleData, setLifecycleData] = useState<UserLifecycleData | null>(
		null,
	);
	const [orgError, setOrgError] = useState(false);

	useEffect(() => {
		if (isPending || !session) {
			setLifecycleChecked(false);
			setNeedsOnboarding(false);
			setLifecycleData(null);
			setOrgError(false);
			return;
		}
		if (orgError) return; // hold error UI; don't re-fetch

		let cancelled = false;
		(async () => {
			try {
				const data = await fetchUserLifecycleData(authClient);
				if (cancelled) return;
				setLifecycleData(data);
				setNeedsOnboarding(!data.hasOrganization);
				setLifecycleChecked(true);
			} catch (err) {
				if (!cancelled) {
					console.error("Failed to check org lifecycle:", err);
					setOrgError(true);
					setLifecycleChecked(true);
				}
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [isPending, session, orgError]);

	const retryLifecycleCheck = useCallback(() => {
		setOrgError(false);
		setLifecycleChecked(false);
	}, []);

	return {
		lifecycleChecked,
		needsOnboarding,
		lifecycleData,
		orgError,
		retryLifecycleCheck,
	};
}
