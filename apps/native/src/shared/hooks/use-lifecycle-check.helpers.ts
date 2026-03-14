import type { UserLifecycleData } from "@pengana/org-client/lib/user-lifecycle";

type SessionWithActiveOrganization = {
	session?: {
		activeOrganizationId?: string | null;
	} | null;
} | null;

type LifecycleAuthClient = {
	getSession: () => Promise<{ data?: SessionWithActiveOrganization | null }>;
	organization: {
		setActive: (opts: { organizationId: string }) => Promise<{
			error?: { message?: string } | null;
		}>;
	};
};

export async function ensureActiveOrganizationForSession({
	authClient,
	session,
	lifecycleData,
}: {
	authClient: LifecycleAuthClient;
	session: SessionWithActiveOrganization;
	lifecycleData: UserLifecycleData;
}): Promise<SessionWithActiveOrganization> {
	if (session?.session?.activeOrganizationId) {
		return session;
	}

	const organizationId = lifecycleData.organizations[0]?.id;
	if (!organizationId) {
		return session;
	}

	const setActiveResult = await authClient.organization.setActive({
		organizationId,
	});

	if (setActiveResult.error) {
		throw new Error(
			setActiveResult.error.message ?? "Failed to set active organization",
		);
	}

	const refreshedSession = await authClient.getSession();
	return refreshedSession.data ?? session;
}
