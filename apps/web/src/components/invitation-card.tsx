import type { ReactNode } from "react";

export function InvitationCard({
	orgName,
	role,
	actions,
}: {
	orgName: string;
	role: string;
	actions: ReactNode;
}) {
	return (
		<div className="flex items-center justify-between rounded-md border p-3">
			<div className="flex flex-col gap-0.5">
				<span className="font-medium text-sm">{orgName}</span>
				<span className="text-muted-foreground text-xs">{role}</span>
			</div>
			<div className="flex gap-1">{actions}</div>
		</div>
	);
}
