import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import { Input } from "@pengana/ui/components/input";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import {
	useActiveOrg,
	useInvalidateOrg,
	useTeamMembers,
	useTeams,
} from "@/hooks/use-org-queries";
import { useOrgRole } from "@/hooks/use-org-role";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/org/teams/$teamId")({
	component: TeamDetailPage,
});

function TeamDetailPage() {
	const { teamId } = Route.useParams();
	const { t } = useTranslation("organization");
	const navigate = useNavigate();
	const { data: activeOrg } = useActiveOrg();
	const { isAdmin } = useOrgRole();
	const { data: teams, isPending: teamsLoading } = useTeams(activeOrg?.id);
	const { data: teamMembers, isPending: membersLoading } =
		useTeamMembers(teamId);
	const { invalidateTeams, invalidateTeamMembers } = useInvalidateOrg();
	const [memberEmail, setMemberEmail] = useState("");
	const [editingName, setEditingName] = useState(false);
	const [newName, setNewName] = useState("");
	const [savingName, setSavingName] = useState(false);

	const team = teams?.find((t) => t.id === teamId);

	if (teamsLoading || membersLoading) {
		return <p>{t("common:status.loading")}</p>;
	}

	if (!team || !activeOrg) {
		return <p className="text-muted-foreground">{t("noActiveOrg")}</p>;
	}

	const handleAddMember = async (e: React.FormEvent) => {
		e.preventDefault();
		const member = activeOrg.members?.find((m) => m.user.email === memberEmail);
		if (!member) {
			toast.error(t("teams.error"));
			return;
		}
		try {
			const { error } = await authClient.organization.addTeamMember({
				teamId: team.id,
				userId: member.userId,
			});
			if (error) {
				toast.error(error.message || t("teams.error"));
				return;
			}
			toast.success(t("teams.addMemberSuccess"));
			setMemberEmail("");
			await invalidateTeamMembers(teamId);
		} catch {
			toast.error(t("teams.error"));
		}
	};

	const handleRemoveMember = async (userId: string) => {
		try {
			const { error } = await authClient.organization.removeTeamMember({
				teamId: team.id,
				userId,
			});
			if (error) {
				toast.error(error.message || t("teams.error"));
				return;
			}
			toast.success(t("teams.removeMemberSuccess"));
			await invalidateTeamMembers(teamId);
		} catch {
			toast.error(t("teams.error"));
		}
	};

	const handleDelete = async () => {
		if (!confirm(t("teams.deleteConfirm"))) return;
		try {
			const { error } = await authClient.organization.removeTeam({
				teamId: team.id,
			});
			if (error) {
				toast.error(error.message || t("teams.error"));
				return;
			}
			toast.success(t("teams.deleteSuccess"));
			await invalidateTeams(activeOrg?.id);
			navigate({ to: "/org/teams" });
		} catch {
			toast.error(t("teams.error"));
		}
	};

	const handleUpdateName = async (e: React.FormEvent) => {
		e.preventDefault();
		setSavingName(true);
		try {
			const { error } = await authClient.organization.updateTeam({
				teamId: team.id,
				data: { name: newName },
			});
			if (error) {
				toast.error(error.message || t("teams.error"));
				return;
			}
			toast.success(t("teams.updateNameSuccess"));
			await invalidateTeams(activeOrg?.id);
			setEditingName(false);
		} catch {
			toast.error(t("teams.error"));
		} finally {
			setSavingName(false);
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				{isAdmin && editingName ? (
					<form onSubmit={handleUpdateName} className="flex items-center gap-2">
						<Input
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							className="h-8 w-48 text-sm"
							required
						/>
						<Button type="submit" size="xs" disabled={savingName}>
							{t("teams.updateName")}
						</Button>
						<Button
							type="button"
							variant="outline"
							size="xs"
							onClick={() => setEditingName(false)}
						>
							{t("invitations.cancel")}
						</Button>
					</form>
				) : (
					<h2
						className="font-medium text-sm"
						onDoubleClick={() => {
							if (isAdmin) {
								setNewName(team.name);
								setEditingName(true);
							}
						}}
					>
						{team.name}
					</h2>
				)}
				{isAdmin && (
					<Button variant="destructive" size="sm" onClick={handleDelete}>
						{t("teams.delete")}
					</Button>
				)}
			</div>

			{isAdmin && (
				<form
					onSubmit={handleAddMember}
					className="flex max-w-md items-end gap-2"
				>
					<div className="flex flex-1 flex-col gap-1">
						<Input
							type="email"
							value={memberEmail}
							onChange={(e) => setMemberEmail(e.target.value)}
							placeholder={t("invitations.emailPlaceholder")}
							required
						/>
					</div>
					<Button type="submit" size="sm">
						{t("teams.addMember")}
					</Button>
				</form>
			)}

			{teamMembers && teamMembers.length > 0 ? (
				<table className="w-full text-xs">
					<thead>
						<tr className="border-b text-left text-muted-foreground">
							<th className="pb-2">Name</th>
							<th className="pb-2">Email</th>
							<th className="pb-2" />
						</tr>
					</thead>
					<tbody>
						{teamMembers.map((tm) => {
							const orgMember = activeOrg?.members?.find(
								(m) => m.userId === tm.userId,
							);
							return (
								<tr key={tm.id} className="border-b">
									<td className="py-2">{orgMember?.user.name ?? tm.userId}</td>
									<td className="py-2">{orgMember?.user.email ?? ""}</td>
									<td className="py-2 text-right">
										{isAdmin && (
											<Button
												variant="destructive"
												size="xs"
												onClick={() => handleRemoveMember(tm.userId)}
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
			) : (
				<p className="text-muted-foreground text-xs">{t("teams.noMembers")}</p>
			)}
		</div>
	);
}
