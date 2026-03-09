import { createContext, use } from "react";
import type { AuthClientOrg } from "../types";

export type {
	AuthClientOrg,
	Organization,
	OrganizationBase,
	OrgInvitation,
	OrgMember,
	Team,
	TeamMember,
	UserInvitation,
} from "../types";

const AuthClientContext = createContext<AuthClientOrg | null>(null);

export function AuthClientProvider({
	client,
	children,
}: {
	client: AuthClientOrg;
	children: React.ReactNode;
}) {
	return <AuthClientContext value={client}>{children}</AuthClientContext>;
}

export function useAuthClient(): AuthClientOrg {
	const client = use(AuthClientContext);
	if (!client) {
		throw new Error(
			"useAuthClient must be used within an <AuthClientProvider>",
		);
	}
	return client;
}
