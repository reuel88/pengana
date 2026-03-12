import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@pengana/ui/components/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/shared/lib/auth-client";
import { Loader } from "@/shared/ui/loader";

interface Session {
	token: string;
	userAgent?: string | null;
	ipAddress?: string | null;
	updatedAt: Date;
}

export function SessionsList() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { data: currentSession } = authClient.useSession();

	const { data: sessions = [], isLoading } = useQuery({
		queryKey: ["sessions"],
		queryFn: async () => {
			const res = await authClient.listSessions();
			return (res.data as Session[]) ?? [];
		},
	});

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: ["sessions"] });

	const revokeMutation = useMutation({
		mutationFn: (token: string) => authClient.revokeSession({ token }),
		onSuccess: () => {
			toast.success(t("auth:settings.sessions.revokeSuccess"));
			invalidate();
		},
	});

	const revokeAllMutation = useMutation({
		mutationFn: () => authClient.revokeSessions(),
		onSuccess: () => {
			toast.success(t("auth:settings.sessions.revokeSuccess"));
			invalidate();
		},
	});

	if (isLoading) return <Loader />;

	return (
		<div className="space-y-4">
			{sessions.length > 1 && (
				<div className="flex justify-end">
					<Button variant="outline" onClick={() => revokeAllMutation.mutate()}>
						{t("auth:settings.sessions.revokeAll")}
					</Button>
				</div>
			)}

			{sessions.map((session) => {
				const isCurrent = currentSession?.session.token === session.token;

				return (
					<Card key={session.token}>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<span>
									{session.userAgent
										? session.userAgent.slice(0, 60)
										: t("auth:settings.sessions.device")}
								</span>
								{isCurrent && (
									<span className="rounded bg-primary/10 px-2 py-0.5 text-primary text-xs">
										{t("auth:settings.sessions.current")}
									</span>
								)}
							</CardTitle>
						</CardHeader>
						<CardContent className="flex items-center justify-between">
							<span className="text-muted-foreground text-xs">
								{t("auth:settings.sessions.lastActive")}:{" "}
								{new Date(session.updatedAt).toLocaleString()}
							</span>
							{!isCurrent && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => revokeMutation.mutate(session.token)}
								>
									{t("auth:settings.sessions.revoke")}
								</Button>
							)}
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
