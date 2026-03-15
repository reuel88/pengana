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
	designPreset?: Record<string, unknown> | null;
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
	inviterName?: string;
	organizationSlug?: string;
	organizationLogo?: string | null;
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
		create: (opts: { name: string; slug: string; logo?: string }) => Promise<{
			data?: OrganizationBase | null;
			error?: { message?: string } | null;
		}>;
		setActive: (opts: { organizationId: string }) => Promise<{
			data?: unknown;
			error?: { message?: string } | null;
		}>;
		acceptInvitation: (opts: { invitationId: string }) => Promise<{
			data?: unknown;
			error?: { message?: string } | null;
		}>;
		rejectInvitation: (opts: { invitationId: string }) => Promise<{
			data?: unknown;
			error?: { message?: string } | null;
		}>;
		inviteMember: (opts: {
			email: string;
			role: "owner" | "admin" | "member";
			organizationId: string;
		}) => Promise<{
			data?: unknown;
			error?: { message?: string } | null;
		}>;
		update: (opts: {
			data: {
				name?: string;
				slug?: string;
				logo?: string;
				designPreset?: Record<string, unknown>;
			};
		}) => Promise<{
			data?: unknown;
			error?: { message?: string } | null;
		}>;
		delete: (opts: { organizationId: string }) => Promise<{
			data?: unknown;
			error?: { message?: string } | null;
		}>;
		updateMemberRole: (opts: {
			memberId: string;
			role: string;
			organizationId?: string;
		}) => Promise<{
			data?: unknown;
			error?: { message?: string } | null;
		}>;
		removeMember: (opts: {
			memberIdOrEmail: string;
			organizationId?: string;
		}) => Promise<{
			data?: unknown;
			error?: { message?: string } | null;
		}>;
		cancelInvitation: (opts: { invitationId: string }) => Promise<{
			data?: unknown;
			error?: { message?: string } | null;
		}>;
		createTeam: (opts: { name: string; organizationId: string }) => Promise<{
			data?: unknown;
			error?: { message?: string } | null;
		}>;
		updateTeam: (opts: { teamId: string; data: { name: string } }) => Promise<{
			data?: unknown;
			error?: { message?: string } | null;
		}>;
		removeTeam: (opts: { teamId: string; organizationId?: string }) => Promise<{
			data?: unknown;
			error?: { message?: string } | null;
		}>;
		addTeamMember: (opts: { teamId: string; userId: string }) => Promise<{
			data?: unknown;
			error?: { message?: string } | null;
		}>;
		removeTeamMember: (opts: { teamId: string; userId: string }) => Promise<{
			data?: unknown;
			error?: { message?: string } | null;
		}>;
	};
}

export interface NotifyFn {
	success: (message: string) => void;
	error: (message: string) => void;
}

export interface AuthMutationOptions<T> {
	mutationFn: () => Promise<{
		data?: T | null;
		error?: { message?: string } | null;
	}>;
	successMessage?: string;
	errorMessage: string;
	preferServerErrorMessage?: boolean;
	// biome-ignore lint/suspicious/noConfusingVoidType: callbacks may return void or a Promise
	onSuccess?: (data: T | null) => void | Promise<unknown>;
	setLoading?: (loading: boolean) => void;
	notify?: NotifyFn;
	onError?: (message: string) => void;
}

export type UserLifecycleData = {
	hasOrganization: boolean;
	hasPendingInvitations: boolean;
	organizations: OrganizationBase[];
};
