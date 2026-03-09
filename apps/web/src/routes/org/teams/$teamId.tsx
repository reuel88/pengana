import { useTranslation } from "@pengana/i18n";
import {
	useTeamActions,
	useTeamMemberAdd,
	useTeamNameEditor,
} from "@pengana/org-client";
import { Button } from "@pengana/ui/components/button";
import { Input } from "@pengana/ui/components/input";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import {
	useActiveOrg,
	useTeamMembers,
	useTeams,
} from "@/hooks/use-org-queries";
import { useOrgRole } from "@/hooks/use-org-role";

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

	return (
		<h2
			className="font-medium text-sm"
			onDoubleClick={() => {
				if (isAdmin) {
					setNewName(team.name);
					setEditing(true);
				}
			}}
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

function TeamMembersTable({
	teamId,
	teamMembers,
	orgMembers,
}: {
	teamId: string;
	teamMembers: Array<{ id: string; userId: string }>;
	orgMembers: Array<{
		userId: string;
		user: { name?: string; email: string };
	}>;
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

	return (
		<table className="w-full text-xs">
			<thead>
				<tr className="border-b text-left text-muted-foreground">
					<th className="pb-2">{t("members.name")}</th>
					<th className="pb-2">{t("members.email")}</th>
					<th className="pb-2" />
				</tr>
			</thead>
			<tbody>
				{teamMembers.map((tm) => {
					const orgMember = orgMembers.find((m) => m.userId === tm.userId);
					return (
						<tr key={tm.id} className="border-b">
							<td className="py-2">{orgMember?.user.name ?? tm.userId}</td>
							<td className="py-2">{orgMember?.user.email ?? ""}</td>
							<td className="py-2 text-right">
								{isAdmin && (
									<Button
										variant="destructive"
										size="xs"
										onClick={() => handleRemoveMember(teamId, tm.userId)}
									>
										{t("teams.removeMember")}
									</Button>
								)}
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
}

function TeamDetailPage() {
	const { teamId } = Route.useParams();
	const { t } = useTranslation("organization");
	const navigate = useNavigate();
	const { data: activeOrg } = useActiveOrg();
	const { isAdmin } = useOrgRole();
	const { data: teams, isPending: teamsLoading } = useTeams(activeOrg?.id);
	const { data: teamMembers, isPending: membersLoading } =
		useTeamMembers(teamId);

	const { handleDeleteTeam } = useTeamActions({
		onDeleteSuccess: () => {
			toast.success(t("teams.deleteSuccess"));
			navigate({ to: "/org/teams" });
		},
		onError: (message) => toast.error(message || t("teams.error")),
	});

	const team = teams?.find((tm) => tm.id === teamId);

	if (teamsLoading || membersLoading) {
		return <p>{t("common:status.loading")}</p>;
	}

	if (!team || !activeOrg) {
		return <p className="text-muted-foreground">{t("noActiveOrg")}</p>;
	}

	const onDelete = async () => {
		if (!confirm(t("teams.deleteConfirm"))) return;
		await handleDeleteTeam(team.id, activeOrg.id);
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<TeamNameEditor team={team} orgId={activeOrg.id} />
				{isAdmin && (
					<Button variant="destructive" size="sm" onClick={onDelete}>
						{t("teams.delete")}
					</Button>
				)}
			</div>

			{isAdmin && (
				<TeamMemberAddForm teamId={teamId} members={activeOrg.members ?? []} />
			)}

			<TeamMembersTable
				teamId={teamId}
				teamMembers={teamMembers ?? []}
				orgMembers={activeOrg.members ?? []}
			/>
		</div>
	);
}
