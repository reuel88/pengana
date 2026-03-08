import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@pengana/ui/components/dropdown-menu";
import { Bell } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	useInvalidateNotifications,
	useNotifications,
} from "@/features/notifications/use-notification-queries";
import { useInvalidateOrg, useUserInvitations } from "@/hooks/use-org-queries";
import { authClient } from "@/lib/auth-client";
import { client } from "@/utils/orpc";

export function NotificationCenter() {
	const { t } = useTranslation("notifications");
	const { data: invitations } = useUserInvitations();
	const { data: notifications } = useNotifications();
	const { invalidateUserInvitations, invalidateActiveOrg, invalidateListOrgs } =
		useInvalidateOrg();
	const { invalidateNotifications } = useInvalidateNotifications();
	const [actingId, setActingId] = useState<string | null>(null);

	const pending = invitations?.filter((i) => i.status === "pending") ?? [];
	const unreadNotifications = notifications ?? [];
	const badgeCount = pending.length + unreadNotifications.length;

	const handleAccept = async (invitationId: string, organizationId: string) => {
		setActingId(invitationId);
		try {
			const { error } = await authClient.organization.acceptInvitation({
				invitationId,
			});
			if (error) {
				toast.error(error.message || t("error"));
				return;
			}
			await authClient.organization.setActive({ organizationId });
			await Promise.all([
				invalidateUserInvitations(),
				invalidateActiveOrg(),
				invalidateListOrgs(),
			]);
			toast.success(t("accepted"));
			client.notification
				.onInvitationAccepted({ invitationId })
				.catch(() => {});
		} catch {
			toast.error(t("error"));
		} finally {
			setActingId(null);
		}
	};

	const handleReject = async (invitationId: string) => {
		setActingId(invitationId);
		try {
			const { error } = await authClient.organization.rejectInvitation({
				invitationId,
			});
			if (error) {
				toast.error(error.message || t("error"));
				return;
			}
			await invalidateUserInvitations();
			toast.success(t("rejected"));
		} catch {
			toast.error(t("error"));
		} finally {
			setActingId(null);
		}
	};

	const handleMarkRead = async (id: string) => {
		await client.notification.markRead({ id });
		await invalidateNotifications();
	};

	const handleMarkAllRead = async () => {
		await client.notification.markAllRead();
		await invalidateNotifications();
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="outline" size="icon" />}>
				<span className="relative">
					<Bell className="h-[1.2rem] w-[1.2rem]" />
					{badgeCount > 0 && (
						<span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 font-medium text-destructive-foreground text-xs">
							{badgeCount}
						</span>
					)}
				</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-72">
				<div className="px-2 py-1.5 font-semibold text-sm">{t("title")}</div>
				{badgeCount === 0 ? (
					<div className="px-2 py-4 text-center text-muted-foreground text-sm">
						{t("empty")}
					</div>
				) : (
					<>
						{pending.length > 0 && (
							<>
								<div className="px-2 py-1 font-medium text-muted-foreground text-xs">
									{t("invitations")}
								</div>
								{pending.map((invitation) => (
									<DropdownMenuItem
										key={invitation.id}
										onSelect={(e) => e.preventDefault()}
										className="flex flex-col items-start gap-2 p-2"
									>
										<div className="flex w-full items-center justify-between">
											<div className="flex flex-col gap-0.5">
												<span className="font-medium text-sm">
													{invitation.organizationName}
												</span>
												<span className="text-muted-foreground text-xs">
													{invitation.role}
												</span>
											</div>
											<div className="flex gap-1">
												<Button
													size="sm"
													variant="default"
													disabled={actingId !== null}
													onClick={() =>
														handleAccept(
															invitation.id,
															invitation.organizationId,
														)
													}
												>
													{t("accept")}
												</Button>
												<Button
													size="sm"
													variant="outline"
													disabled={actingId !== null}
													onClick={() => handleReject(invitation.id)}
												>
													{t("reject")}
												</Button>
											</div>
										</div>
									</DropdownMenuItem>
								))}
							</>
						)}
						{unreadNotifications.length > 0 && (
							<>
								<div className="px-2 py-1 font-medium text-muted-foreground text-xs">
									{t("notifications")}
								</div>
								{unreadNotifications.map((n) => (
									<DropdownMenuItem
										key={n.id}
										onSelect={(e) => e.preventDefault()}
										className="flex items-center justify-between gap-2 p-2"
									>
										<div className="flex flex-col gap-0.5">
											<span className="text-sm">{n.body}</span>
											<span className="text-muted-foreground text-xs">
												{new Date(n.createdAt).toLocaleDateString()}
											</span>
										</div>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => handleMarkRead(n.id)}
										>
											&times;
										</Button>
									</DropdownMenuItem>
								))}
								<div className="border-t px-2 py-1.5">
									<button
										type="button"
										className="text-muted-foreground text-xs hover:text-foreground"
										onClick={handleMarkAllRead}
									>
										{t("markAllRead")}
									</button>
								</div>
							</>
						)}
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
