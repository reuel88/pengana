import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@pengana/ui/components/dropdown-menu";
import { Bell } from "lucide-react";

import { InvitationCard } from "@/components/invitation-card";
import { useNotificationCenter } from "./use-notification-center";

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
	onAccept: (id: string) => void;
	onReject: (id: string) => void;
}) {
	const { t } = useTranslation("notifications");

	return (
		<div className="p-2">
			<InvitationCard
				orgName={invitation.organizationName}
				role={invitation.role}
				actions={
					<>
						<Button
							size="sm"
							variant="default"
							disabled={disabled}
							onClick={() => onAccept(invitation.id)}
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
					</>
				}
			/>
		</div>
	);
}

function NotificationItem({
	notification,
	onMarkRead,
}: {
	notification: { id: string; body: string; createdAt: Date };
	onMarkRead: (id: string) => void;
}) {
	const { t, i18n } = useTranslation("notifications");
	return (
		<div className="flex items-center justify-between gap-2 p-2">
			<div className="flex flex-col gap-0.5">
				<span className="text-sm">{notification.body}</span>
				<span className="text-muted-foreground text-xs">
					{notification.createdAt.toLocaleDateString(i18n.language)}
				</span>
			</div>
			<Button
				size="sm"
				variant="ghost"
				onClick={() => onMarkRead(notification.id)}
				aria-label={t("markRead")}
			>
				&times;
			</Button>
		</div>
	);
}

export function NotificationCenter() {
	const { t } = useTranslation("notifications");

	const {
		pending,
		notifications,
		badgeCount,
		handleMarkRead,
		handleMarkAllRead,
		invitationActions,
	} = useNotificationCenter();

	const { actingId, handleAccept, handleReject } = invitationActions;

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
						{notifications.length > 0 && (
							<>
								<div className="px-2 py-1 font-medium text-muted-foreground text-xs">
									{t("notifications")}
								</div>
								{notifications.map((n) => (
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
