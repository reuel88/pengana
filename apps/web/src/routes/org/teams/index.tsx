import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import {
	Dialog,
	DialogCloseButton,
	DialogPopup,
	DialogTitle,
	DialogTrigger,
} from "@pengana/ui/components/dialog";
import { Input } from "@pengana/ui/components/input";
import { Label } from "@pengana/ui/components/label";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import {
	useActiveOrg,
	useInvalidateOrg,
	useTeams,
} from "@/hooks/use-org-queries";
import { useOrgRole } from "@/hooks/use-org-role";
import { authClient } from "@/lib/auth-client";
import { authMutation } from "@/lib/auth-mutation";

export const Route = createFileRoute("/org/teams/")({
	component: TeamsIndexPage,
});

function TeamsIndexPage() {
	const { t } = useTranslation("organization");
	const { data: activeOrg, isPending } = useActiveOrg();
	const { data: teams, isPending: teamsLoading } = useTeams(activeOrg?.id);
	const { invalidateTeams } = useInvalidateOrg();
	const [createOpen, setCreateOpen] = useState(false);
	const [teamName, setTeamName] = useState("");
	const [loading, setLoading] = useState(false);
	const { isAdmin } = useOrgRole();

	if (isPending || teamsLoading) {
		return <p>{t("common:status.loading")}</p>;
	}

	if (!activeOrg) {
		return <p className="text-muted-foreground">{t("noActiveOrg")}</p>;
	}

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		await authMutation({
			mutationFn: () =>
				authClient.organization.createTeam({
					name: teamName,
					organizationId: activeOrg.id,
				}),
			successMessage: t("teams.createSuccess"),
			errorMessage: t("teams.error"),
			setLoading,
			onSuccess: async () => {
				await invalidateTeams(activeOrg.id);
				setCreateOpen(false);
				setTeamName("");
			},
		});
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<h2 className="font-medium text-sm">{t("teams.title")}</h2>
				{isAdmin && (
					<Dialog open={createOpen} onOpenChange={setCreateOpen}>
						<DialogTrigger render={<Button size="sm" />}>
							{t("teams.create")}
						</DialogTrigger>
						<DialogPopup>
							<DialogCloseButton />
							<DialogTitle>{t("teams.create")}</DialogTitle>
							<form
								onSubmit={handleCreate}
								className="mt-4 flex flex-col gap-3"
							>
								<div className="flex flex-col gap-1">
									<Label htmlFor="team-name">{t("teams.name")}</Label>
									<Input
										id="team-name"
										value={teamName}
										onChange={(e) => setTeamName(e.target.value)}
										placeholder={t("teams.namePlaceholder")}
										required
									/>
								</div>
								<Button type="submit" disabled={loading || !teamName}>
									{loading ? t("common:submitting") : t("teams.create")}
								</Button>
							</form>
						</DialogPopup>
					</Dialog>
				)}
			</div>

			{!teams || teams.length === 0 ? (
				<p className="text-muted-foreground text-xs">{t("teams.noTeams")}</p>
			) : (
				<div className="flex flex-col gap-2">
					{teams.map((team) => (
						<Link
							key={team.id}
							to="/org/teams/$teamId"
							params={{ teamId: team.id }}
							className="flex items-center justify-between border p-3 text-xs hover:bg-muted"
						>
							<span>{team.name}</span>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
