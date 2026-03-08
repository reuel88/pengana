import { createContext, use } from "react";

export interface OrgMember {
	id: string;
	organizationId: string;
	userId: string;
	role: string;
	createdAt: Date;
	teamId?: string;
	user: { id: string; name: string; email: string; image?: string };
}

export interface OrgInvitation {
	id: string;
	email: string;
	role: string;
	status: string;
	organizationId: string;
	inviterId: string;
	teamId?: string;
	expiresAt: Date;
}

export interface OrganizationBase {
	id: string;
	name: string;
	slug: string;
	logo?: string | null;
	createdAt: Date;
	metadata?: unknown;
}

export interface Organization extends OrganizationBase {
	members: OrgMember[];
	invitations: OrgInvitation[];
	teams?: {
		id: string;
		name: string;
		organizationId: string;
		createdAt: Date;
	}[];
}

export interface UserInvitation {
	id: string;
	organizationId: string;
	organizationName: string;
	email: string;
	role: string;
	status: string;
	inviterId: string;
	expiresAt: Date;
	createdAt: Date;
	teamId?: string;
	inviterEmail?: string;
	[key: string]: unknown;
}

export interface Team {
	id: string;
	name: string;
}

export interface TeamMember {
	id: string;
	userId: string;
}

export interface AuthClientOrg {
	organization: {
		getFullOrganization: () => Promise<{
			data?: Organization | null;
			error?: { message?: string } | null;
		}>;
		getActiveMember: () => Promise<{
			data?: { role?: string } | null;
			error?: { message?: string } | null;
		}>;
		list: () => Promise<{
			data?: OrganizationBase[] | null;
			error?: { message?: string } | null;
		}>;
		listTeams: (opts: { query: { organizationId: string } }) => Promise<{
			data?: Team[] | null;
			error?: { message?: string } | null;
		}>;
		listTeamMembers: (opts: { query: { teamId: string } }) => Promise<{
			data?: TeamMember[] | null;
			error?: { message?: string } | null;
		}>;
		listUserInvitations: () => Promise<{
			data?: UserInvitation[] | null;
			error?: { message?: string } | null;
		}>;
		getInvitation: (opts: { query: { id: string } }) => Promise<{
			data?: UserInvitation | null;
			error?: { message?: string } | null;
		}>;
	};
}

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
