import { env } from "@pengana/env/web";
import { polarClient } from "@polar-sh/better-auth";
import { redirect } from "@tanstack/react-router";
import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: env.VITE_SERVER_URL,
	plugins: [polarClient(), organizationClient({ teams: { enabled: true } })],
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
