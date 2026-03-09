import { useTranslation } from "@pengana/i18n";
import type { UserInvitation } from "@pengana/org-client";
import { Button } from "@pengana/ui/components/button";

import { useInvitationActions } from "@/hooks/use-invitation-actions";

export function UserInvitationsTable({
	invitations,
}: {
	invitations: UserInvitation[];
}) {
	const { t } = useTranslation("organization");

	const { actingId, handleAccept, handleReject } = useInvitationActions({
		successMessage: t("invitations.acceptSuccess"),
		errorMessage: t("invitations.error"),
		rejectSuccessMessage: t("invitations.rejectSuccess"),
	});

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
