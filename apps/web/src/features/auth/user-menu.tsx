import { useTranslation } from "@pengana/i18n";
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
import { Link } from "@tanstack/react-router";
import { useSignOut } from "@/shared/hooks/use-sign-out";
import { authClient } from "@/shared/lib/auth-client";

export function UserMenu() {
	const { data: session, isPending } = authClient.useSession();
	const { t } = useTranslation();
	const handleSignOut = useSignOut();

	if (isPending) {
		return <Skeleton className="h-9 w-24" />;
	}

	if (!session) {
		return (
			<Link to="/login">
				<Button variant="outline">{t("user.signIn")}</Button>
			</Link>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant="outline" />}>
				{session.user.name}
			</DropdownMenuTrigger>
			<DropdownMenuContent className="bg-card">
				<DropdownMenuGroup>
					<DropdownMenuLabel>{t("user.myAccount")}</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem>{session.user.email}</DropdownMenuItem>
					<DropdownMenuItem render={<Link to="/settings/account" />}>
						{t("user.settings")}
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						variant="destructive"
						onClick={handleSignOut}
						data-testid="sign-out-trigger"
					>
						{t("user.signOut")}
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
