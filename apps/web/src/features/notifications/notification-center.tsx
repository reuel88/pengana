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
import { authMutation } from "@/lib/auth-mutation";
import { client } from "@/utils/orpc";

function InvitationItem({
	invitation,
	disabled,
	onAccept,
	onReject,
}: {
	invitation: {
		id: string;
		organizationName: string;
		organizationId: string;
		role: string;
	};
	disabled: boolean;
	onAccept: (id: string, orgId: string) => void;
	onReject: (id: string) => void;
}) {
	const { t } = useTranslation("notifications");

	return (
		<DropdownMenuItem
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
						disabled={disabled}
						onClick={() => onAccept(invitation.id, invitation.organizationId)}
					>
						{t("accept")}
					</Button>
					<Button
						size="sm"
						variant="outline"
						disabled={disabled}
						onClick={() => onReject(invitation.id)}
					>
						{t("reject")}
					</Button>
				</div>
			</div>
		</DropdownMenuItem>
	);
}

function NotificationItem({
	notification,
	onMarkRead,
}: {
	notification: { id: string; body: string; createdAt: Date };
	onMarkRead: (id: string) => void;
}) {
	return (
		<DropdownMenuItem
			onSelect={(e) => e.preventDefault()}
			className="flex items-center justify-between gap-2 p-2"
		>
			<div className="flex flex-col gap-0.5">
				<span className="text-sm">{notification.body}</span>
				<span className="text-muted-foreground text-xs">
					{notification.createdAt.toLocaleDateString()}
				</span>
			</div>
			<Button
				size="sm"
				variant="ghost"
				onClick={() => onMarkRead(notification.id)}
			>
				&times;
			</Button>
		</DropdownMenuItem>
	);
}

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
			await authMutation({
				mutationFn: () =>
					authClient.organization.acceptInvitation({ invitationId }),
				successMessage: t("accepted"),
				errorMessage: t("error"),
				onSuccess: async () => {
					await authClient.organization.setActive({ organizationId });
					await Promise.all([
						invalidateUserInvitations(),
						invalidateActiveOrg(),
						invalidateListOrgs(),
					]);
					client.notification
						.onInvitationAccepted({ invitationId })
						.catch(() => {});
				},
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
				successMessage: t("rejected"),
				errorMessage: t("error"),
				onSuccess: () => invalidateUserInvitations(),
			});
		} finally {
			setActingId(null);
		}
	};

	const handleMarkRead = async (id: string) => {
		try {
			await client.notification.markRead({ id });
			await invalidateNotifications();
		} catch {
			toast.error(t("error"));
		}
	};

	const handleMarkAllRead = async () => {
		try {
			await client.notification.markAllRead();
			await invalidateNotifications();
		} catch {
			toast.error(t("error"));
		}
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
									<InvitationItem
										key={invitation.id}
										invitation={invitation}
										disabled={actingId !== null}
										onAccept={handleAccept}
										onReject={handleReject}
									/>
								))}
							</>
						)}
						{unreadNotifications.length > 0 && (
							<>
								<div className="px-2 py-1 font-medium text-muted-foreground text-xs">
									{t("notifications")}
								</div>
								{unreadNotifications.map((n) => (
									<NotificationItem
										key={n.id}
										notification={n}
										onMarkRead={handleMarkRead}
									/>
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
