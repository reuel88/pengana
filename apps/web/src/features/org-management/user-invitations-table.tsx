import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import { useState } from "react";

import { useInvalidateOrg } from "@/hooks/use-org-queries";
import { authClient } from "@/lib/auth-client";
import { authMutation } from "@/lib/auth-mutation";

interface UserInvitation {
	id: string;
	organizationName: string;
	role: string;
	status: string;
}

export function UserInvitationsTable({
	invitations,
}: {
	invitations: UserInvitation[];
}) {
	const { t } = useTranslation("organization");
	const { invalidateUserInvitations, invalidateActiveOrg, invalidateListOrgs } =
		useInvalidateOrg();
	const [actingId, setActingId] = useState<string | null>(null);

	const handleAccept = async (invitationId: string) => {
		setActingId(invitationId);
		try {
			await authMutation({
				mutationFn: () =>
					authClient.organization.acceptInvitation({ invitationId }),
				successMessage: t("invitations.acceptSuccess"),
				errorMessage: t("invitations.error"),
				onSuccess: () =>
					Promise.all([
						invalidateUserInvitations(),
						invalidateActiveOrg(),
						invalidateListOrgs(),
					]),
			});
		} finally {
			setActingId(null);
		}
	};

	const handleReject = async (invitationId: string) => {
		setActingId(invitationId);
		try {
			await authMutation({
				mutationFn: () =>
					authClient.organization.rejectInvitation({ invitationId }),
				successMessage: t("invitations.rejectSuccess"),
				errorMessage: t("invitations.error"),
				onSuccess: () =>
					Promise.all([
						invalidateUserInvitations(),
						invalidateActiveOrg(),
						invalidateListOrgs(),
					]),
			});
		} finally {
			setActingId(null);
		}
	};

	return (
		<div className="flex flex-col gap-3">
			<h2 className="font-medium text-sm">{t("invitations.myInvitations")}</h2>
			{invitations.length === 0 ? (
				<p className="text-muted-foreground text-xs">
					{t("invitations.noInvitations")}
				</p>
			) : (
				<table className="w-full text-xs">
					<thead>
						<tr className="border-b text-left text-muted-foreground">
							<th className="pb-2">{t("create.name")}</th>
							<th className="pb-2">{t("invitations.role")}</th>
							<th className="pb-2" />
						</tr>
					</thead>
					<tbody>
						{invitations.map((inv) => (
							<tr key={inv.id} className="border-b">
								<td className="py-2">{inv.organizationName}</td>
								<td className="py-2">{inv.role}</td>
								<td className="py-2 text-right">
									<div className="flex justify-end gap-2">
										<Button
											size="xs"
											onClick={() => handleAccept(inv.id)}
											disabled={actingId !== null}
										>
											{t("invitations.accept")}
										</Button>
										<Button
											variant="outline"
											size="xs"
											onClick={() => handleReject(inv.id)}
											disabled={actingId !== null}
										>
											{t("invitations.reject")}
										</Button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}
