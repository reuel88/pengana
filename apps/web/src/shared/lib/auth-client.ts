import { env } from "@pengana/env/web";
import { fetchUserLifecycleData } from "@pengana/org-client/lib/user-lifecycle";
import { polarClient } from "@polar-sh/better-auth";
import { redirect } from "@tanstack/react-router";
import {
	magicLinkClient,
	organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: env.VITE_SERVER_URL,
	plugins: [
		polarClient(),
		organizationClient({ teams: { enabled: true } }),
		magicLinkClient(),
	],
	sessionOptions: {
		refetchOnWindowFocus: false,
	},
});

export async function requireAuth() {
	const session = await authClient.getSession();
	if (!session.data) {
		throw redirect({ to: "/login" });
	}
	// Spread narrows `data` from `Session | null` to `Session` after the null check above
	return { session: { ...session, data: session.data } };
}

export async function requireAuthAndOrg() {
	const { session } = await requireAuth();
	const { hasOrganization, organizations } =
		await fetchUserLifecycleData(authClient);
	if (!hasOrganization) {
		throw redirect({ to: "/onboarding" });
	}
	if (!session.data.session.activeOrganizationId && organizations.length > 0) {
		await authClient.organization.setActive({
			organizationId: organizations[0].id,
		});
	}
	return { session };
}
