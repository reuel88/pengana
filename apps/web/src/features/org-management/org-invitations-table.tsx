import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";

import { useInvalidateOrg } from "@/hooks/use-org-queries";
import { authClient } from "@/lib/auth-client";
import { authMutation } from "@/lib/auth-mutation";

interface Invitation {
	id: string;
	email: string;
	role: string;
	status: string;
}

export function OrgInvitationsTable({
	invitations,
	isAdmin,
}: {
	invitations: Invitation[];
	isAdmin: boolean;
}) {
	const { t } = useTranslation("organization");
	const { invalidateActiveOrg } = useInvalidateOrg();

	const handleCancel = async (invitationId: string) => {
		await authMutation({
			mutationFn: () =>
				authClient.organization.cancelInvitation({ invitationId }),
			successMessage: t("invitations.cancelSuccess"),
			errorMessage: t("invitations.error"),
			onSuccess: () => invalidateActiveOrg(),
		});
	};

	return (
		<div className="flex flex-col gap-3">
			<h2 className="font-medium text-sm">{t("invitations.pending")}</h2>
			{invitations.length === 0 ? (
				<p className="text-muted-foreground text-xs">
					{t("invitations.noPending")}
				</p>
			) : (
				<table className="w-full text-xs">
					<thead>
						<tr className="border-b text-left text-muted-foreground">
							<th className="pb-2">{t("invitations.email")}</th>
							<th className="pb-2">{t("invitations.role")}</th>
							<th className="pb-2">{t("invitations.statusHeader")}</th>
							<th className="pb-2" />
						</tr>
					</thead>
					<tbody>
						{invitations.map((inv) => (
							<tr key={inv.id} className="border-b">
								<td className="py-2">{inv.email}</td>
								<td className="py-2">{inv.role}</td>
								<td className="py-2">
									{t(`invitations.status.${inv.status}`)}
								</td>
								<td className="py-2 text-right">
									{isAdmin && inv.status === "pending" && (
										<Button
											variant="outline"
											size="xs"
											onClick={() => handleCancel(inv.id)}
										>
											{t("invitations.cancel")}
										</Button>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}
