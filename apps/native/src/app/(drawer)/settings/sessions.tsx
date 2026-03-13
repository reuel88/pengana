import { useTranslation } from "@pengana/i18n";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { authClient } from "@/shared/lib/auth-client";
import { TEXT_ON_PRIMARY } from "@/shared/lib/design-tokens";
import { useTheme } from "@/shared/lib/theme";
import { Container } from "@/shared/ui/container";

type Session = {
	token: string;
	userAgent?: string | null;
	updatedAt: Date;
};

export default function SessionsScreen() {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const queryClient = useQueryClient();
	const { data: currentSession } = authClient.useSession();

	const sessions = useQuery({
		queryKey: ["native-sessions"],
		queryFn: async () =>
			((await authClient.listSessions()).data as Session[]) ?? [],
	});

	const revoke = useMutation({
		mutationFn: (token: string) => authClient.revokeSession({ token }),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["native-sessions"] }),
	});

	const revokeAll = useMutation({
		mutationFn: () => authClient.revokeSessions(),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["native-sessions"] }),
	});

	return (
		<Container>
			<ScrollView contentContainerStyle={styles.container}>
				{(sessions.data?.length ?? 0) > 1 ? (
					<TouchableOpacity
						style={[styles.button, { backgroundColor: theme.primary }]}
						onPress={() => revokeAll.mutate()}
					>
						<Text style={styles.buttonText}>
							{t("auth:settings.sessions.revokeAll")}
						</Text>
					</TouchableOpacity>
				) : null}

				{sessions.data?.map((session) => {
					const isCurrent = currentSession?.session.token === session.token;

					return (
						<View
							key={session.token}
							style={[
								styles.card,
								{ backgroundColor: theme.card, borderColor: theme.border },
							]}
						>
							<Text style={{ color: theme.text, fontWeight: "600" }}>
								{session.userAgent || t("auth:settings.sessions.device")}
							</Text>
							<Text style={{ color: theme.text, opacity: 0.7 }}>
								{t("auth:settings.sessions.lastActive")}:{" "}
								{new Date(session.updatedAt).toLocaleString()}
							</Text>
							{isCurrent ? (
								<Text style={{ color: theme.primary }}>
									{t("auth:settings.sessions.current")}
								</Text>
							) : (
								<TouchableOpacity
									style={[
										styles.secondaryButton,
										{ borderColor: theme.border },
									]}
									onPress={() => revoke.mutate(session.token)}
								>
									<Text style={{ color: theme.text }}>
										{t("auth:settings.sessions.revoke")}
									</Text>
								</TouchableOpacity>
							)}
						</View>
					);
				})}
			</ScrollView>
		</Container>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
		gap: 12,
	},
	card: {
		padding: 16,
		borderWidth: 1,
		gap: 8,
	},
	button: {
		padding: 12,
		alignItems: "center",
	},
	buttonText: {
		color: TEXT_ON_PRIMARY,
		fontWeight: "600",
	},
	secondaryButton: {
		padding: 10,
		alignItems: "center",
		borderWidth: 1,
	},
});
