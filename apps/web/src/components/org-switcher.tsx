import { useTranslation } from "@pengana/i18n";
import { useOrgSwitcher } from "@pengana/org-client";
import { Button } from "@pengana/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@pengana/ui/components/dropdown-menu";
import { Skeleton } from "@pengana/ui/components/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { useActiveOrg, useListOrgs } from "@/hooks/use-org-queries";
import { authClient } from "@/lib/auth-client";

import { CreateOrgDialog } from "./create-org-dialog";

export function OrgSwitcher() {
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const { t } = useTranslation("organization");
	const navigate = useNavigate();
	const { data: orgs, isPending: orgsPending } = useListOrgs();
	const { data: activeOrg } = useActiveOrg();
	const [createOpen, setCreateOpen] = useState(false);

	const { handleSwitch } = useOrgSwitcher({
		onSwitchSuccess: () => navigate({ to: "/org" }),
		onError: (message) => console.error(message),
	});

	if (sessionPending) {
		return <Skeleton className="h-8 w-24" />;
	}

	if (!session) {
		return null;
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
					{activeOrg?.name || t("switcher.label")}
				</DropdownMenuTrigger>
				<DropdownMenuContent className="bg-card" align="start">
					<DropdownMenuGroup>
						<DropdownMenuLabel>{t("switcher.label")}</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{orgsPending ? (
							<DropdownMenuItem disabled>
								{t("common:status.loading")}
							</DropdownMenuItem>
						) : orgs && orgs.length > 0 ? (
							orgs.map((org) => (
								<DropdownMenuItem
									key={org.id}
									onClick={() => handleSwitch(org.id)}
								>
									{org.name}
									{activeOrg?.id === org.id && (
										<span className="ml-auto text-muted-foreground">●</span>
									)}
								</DropdownMenuItem>
							))
						) : (
							<DropdownMenuItem disabled>
								{t("switcher.noOrgs")}
							</DropdownMenuItem>
						)}
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => setCreateOpen(true)}
							className="gap-1"
						>
							<PlusIcon className="size-3" />
							{t("switcher.create")}
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<CreateOrgDialog open={createOpen} onOpenChange={setCreateOpen} />
		</>
	);
}
