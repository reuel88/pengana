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
import { toast } from "sonner";
import { z } from "zod";

import { OrgGuard } from "@/components/org-guard";
import {
	useActiveOrg,
	useInvalidateOrg,
	useOrgRole,
	useTeams,
} from "@/hooks/use-org-queries";
import { useZodForm } from "@/hooks/use-zod-form";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/org/teams/")({
	component: TeamsIndexPage,
});

const createTeamSchema = z.object({
	teamName: z.string().min(1),
});

function TeamsIndexPage() {
	const { t } = useTranslation("organization");
	const { data: activeOrg } = useActiveOrg();
	const { data: teams, isPending: teamsLoading } = useTeams(activeOrg?.id);
	const { invalidateTeams } = useInvalidateOrg();
	const [createOpen, setCreateOpen] = useState(false);
	const { isAdmin } = useOrgRole();

	const form = useZodForm({
		schema: createTeamSchema,
		defaultValues: { teamName: "" },
		onSubmit: async ({ value }) => {
			if (!activeOrg?.id) return;
			const { error } = await authClient.organization.createTeam({
				name: value.teamName,
				organizationId: activeOrg.id,
			});
			if (error) {
				toast.error(t("teams.error"));
				return;
			}
			toast.success(t("teams.createSuccess"));
			await invalidateTeams(activeOrg.id);
			setCreateOpen(false);
			form.reset();
		},
	});

	return (
		<OrgGuard>
			{(_org) => {
				if (teamsLoading) {
					return <p>{t("common:status.loading")}</p>;
				}

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
											onSubmit={(e) => {
												e.preventDefault();
												form.handleSubmit();
											}}
											className="mt-4 flex flex-col gap-3"
										>
											<form.Field name="teamName">
												{(field) => (
													<div className="flex flex-col gap-1">
														<Label htmlFor="team-name">{t("teams.name")}</Label>
														<Input
															id="team-name"
															value={field.state.value}
															onBlur={field.handleBlur}
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
															placeholder={t("teams.namePlaceholder")}
															required
														/>
													</div>
												)}
											</form.Field>
											<form.Subscribe
												selector={(s): [boolean, boolean] => [
													s.isSubmitting,
													!s.values.teamName,
												]}
											>
												{([isSubmitting, nameEmpty]) => (
													<Button
														type="submit"
														disabled={isSubmitting || nameEmpty}
													>
														{isSubmitting
															? t("common:submitting")
															: t("teams.create")}
													</Button>
												)}
											</form.Subscribe>
										</form>
									</DialogPopup>
								</Dialog>
							)}
						</div>

						{!teams || teams.length === 0 ? (
							<p className="text-muted-foreground text-xs">
								{t("teams.noTeams")}
							</p>
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
			}}
		</OrgGuard>
	);
}
