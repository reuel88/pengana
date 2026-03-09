import { useTranslation } from "@pengana/i18n";
import {
	useTeamActions,
	useTeamMemberAdd,
	useTeamNameEditor,
} from "@pengana/org-client";
import { Button } from "@pengana/ui/components/button";
import { Input } from "@pengana/ui/components/input";
import { cn } from "@pengana/ui/lib/utils";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import type { Column } from "@/components/data-table";
import { DataTable } from "@/components/data-table";
import { OrgGuard } from "@/components/org-guard";
import {
	useActiveOrg,
	useOrgRole,
	useTeamMembers,
	useTeams,
} from "@/hooks/use-org-queries";

export const Route = createFileRoute("/org/teams/$teamId")({
	component: TeamDetailPage,
});

function TeamNameEditor({
	team,
	orgId,
}: {
	team: { id: string; name: string };
	orgId: string;
}) {
	const { t } = useTranslation("organization");
	const { isAdmin } = useOrgRole();

	const { editing, setEditing, newName, setNewName, handleSave, loading } =
		useTeamNameEditor({
			onSuccess: () => toast.success(t("teams.updateNameSuccess")),
			onError: (message) => toast.error(message || t("teams.error")),
		});

	if (isAdmin && editing) {
		return (
			<form
				onSubmit={async (e) => {
					e.preventDefault();
					await handleSave(team.id, orgId);
				}}
				className="flex items-center gap-2"
			>
				<Input
					value={newName}
					onChange={(e) => setNewName(e.target.value)}
					className="h-8 w-48 text-sm"
					required
				/>
				<Button type="submit" size="xs" disabled={loading}>
					{t("teams.updateName")}
				</Button>
				<Button
					type="button"
					variant="outline"
					size="xs"
					onClick={() => setEditing(false)}
				>
					{t("invitations.cancel")}
				</Button>
			</form>
		);
	}

	function enterEdit() {
		setNewName(team.name);
		setEditing(true);
	}

	return (
		<h2
			className={cn("font-medium text-sm", isAdmin && "cursor-pointer")}
			{...(isAdmin && {
				role: "button",
				tabIndex: 0,
				"aria-label": `Edit team name: ${team.name}`,
				onDoubleClick: enterEdit,
				onKeyDown: (e: React.KeyboardEvent) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						enterEdit();
					}
				},
			})}
		>
			{team.name}
		</h2>
	);
}

function TeamMemberAddForm({
	teamId,
	members,
}: {
	teamId: string;
	members: Array<{ id: string; userId: string; user: { email: string } }>;
}) {
	const { t } = useTranslation("organization");

	const { email, setEmail, handleAdd, loading } = useTeamMemberAdd({
		onSuccess: () => toast.success(t("teams.addMemberSuccess")),
		onError: (message) => toast.error(message || t("teams.error")),
	});

	return (
		<form
			onSubmit={async (e) => {
				e.preventDefault();
				await handleAdd(teamId, members);
			}}
			className="flex max-w-md items-end gap-2"
		>
			<div className="flex flex-1 flex-col gap-1">
				<Input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder={t("invitations.emailPlaceholder")}
					required
				/>
			</div>
			<Button type="submit" size="sm" disabled={loading}>
				{t("teams.addMember")}
			</Button>
		</form>
	);
}

type TeamMember = { id: string; userId: string };
type OrgMember = {
	userId: string;
	user: { name?: string; email: string };
};

function TeamMembersTable({
	teamId,
	teamMembers,
	orgMembers,
}: {
	teamId: string;
	teamMembers: TeamMember[];
	orgMembers: OrgMember[];
}) {
	const { t } = useTranslation("organization");
	const { isAdmin } = useOrgRole();

	const { handleRemoveMember } = useTeamActions({
		onRemoveMemberSuccess: () => toast.success(t("teams.removeMemberSuccess")),
		onError: (message) => toast.error(message || t("teams.error")),
	});

	if (teamMembers.length === 0) {
		return (
			<p className="text-muted-foreground text-xs">{t("teams.noMembers")}</p>
		);
	}

	const membersByUserId = new Map(orgMembers.map((m) => [m.userId, m]));

	const columns: Column<TeamMember>[] = [
		{
			id: "name",
			header: t("members.name"),
			cell: (tm) => {
				const orgMember = membersByUserId.get(tm.userId);
				return orgMember?.user.name ?? tm.userId;
			},
		},
		{
			id: "email",
			header: t("members.email"),
			cell: (tm) => {
				const orgMember = membersByUserId.get(tm.userId);
				return orgMember?.user.email ?? "";
			},
		},
		{
			id: "actions",
			header: "",
			cellClassName: "py-2 text-right",
			cell: (tm) =>
				isAdmin ? (
					<Button
						variant="destructive"
						size="xs"
						onClick={() => handleRemoveMember(teamId, tm.userId)}
					>
						{t("teams.removeMember")}
					</Button>
				) : null,
		},
	];

	return (
		<DataTable columns={columns} data={teamMembers} keyFn={(tm) => tm.id} />
	);
}

function TeamDetailPage() {
	const { teamId } = Route.useParams();
	const { t } = useTranslation("organization");
	const navigate = useNavigate();
	const { data: activeOrg } = useActiveOrg();
	const { isAdmin } = useOrgRole();
	const {
		data: teams,
		isPending: teamsLoading,
		isError: teamsError,
	} = useTeams(activeOrg?.id);
	const {
		data: teamMembers,
		isPending: membersLoading,
		isError: membersError,
	} = useTeamMembers(teamId);

	const { handleDeleteTeam } = useTeamActions({
		onDeleteSuccess: () => {
			toast.success(t("teams.deleteSuccess"));
			navigate({ to: "/org/teams" });
		},
		onError: (message) => toast.error(message || t("teams.error")),
	});

	const team = teams?.find((tm) => tm.id === teamId);

	return (
		<OrgGuard>
			{(org) => {
				if (teamsLoading || membersLoading) {
					return <p>{t("common:status.loading")}</p>;
				}

				if (teamsError || membersError) {
					return (
						<p className="text-destructive text-sm">
							{t("common:error.generic")}
						</p>
					);
				}

				if (!team) {
					return <p className="text-muted-foreground">{t("teams.notFound")}</p>;
				}

				const onDelete = async () => {
					if (!confirm(t("teams.deleteConfirm"))) return;
					await handleDeleteTeam(team.id, org.id);
				};

				return (
					<div className="flex flex-col gap-6">
						<div className="flex items-center justify-between">
							<TeamNameEditor team={team} orgId={org.id} />
							{isAdmin && (
								<Button variant="destructive" size="sm" onClick={onDelete}>
									{t("teams.delete")}
								</Button>
							)}
						</div>

						{isAdmin && (
							<TeamMemberAddForm teamId={teamId} members={org.members ?? []} />
						)}

						<TeamMembersTable
							teamId={teamId}
							teamMembers={teamMembers ?? []}
							orgMembers={org.members ?? []}
						/>
					</div>
				);
			}}
		</OrgGuard>
	);
}
