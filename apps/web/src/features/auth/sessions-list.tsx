import { useTranslation } from "@pengana/i18n";
import { Button } from "@pengana/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@pengana/ui/components/card";
import { useCallback, useEffect, useState } from "react";
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
	const { data: currentSession } = authClient.useSession();
	const [sessions, setSessions] = useState<Session[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchSessions = useCallback(async () => {
		setLoading(true);
		try {
			const res = await authClient.listSessions();
			setSessions((res.data as Session[]) ?? []);
		} catch {
			// ignore
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchSessions();
	}, [fetchSessions]);

	const handleRevoke = async (token: string) => {
		await authClient.revokeSession({ token });
		toast.success(t("auth:settings.sessions.revokeSuccess"));
		fetchSessions();
	};

	const handleRevokeAll = async () => {
		await authClient.revokeSessions();
		toast.success(t("auth:settings.sessions.revokeSuccess"));
		fetchSessions();
	};

	if (loading) return <Loader />;

	return (
		<div className="space-y-4">
			{sessions.length > 1 && (
				<div className="flex justify-end">
					<Button variant="outline" onClick={handleRevokeAll}>
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
									onClick={() => handleRevoke(session.token)}
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
