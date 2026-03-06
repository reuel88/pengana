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
import { Link, useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export function UserMenu() {
	const navigate = useNavigate();
	const { data: session, isPending } = authClient.useSession();
	const { t } = useTranslation();

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

	const handleSignOut = () => {
		authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					navigate({ to: "/" });
				},
			},
		});
	};

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
					<DropdownMenuItem variant="destructive" onClick={handleSignOut}>
						{t("user.signOut")}
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
