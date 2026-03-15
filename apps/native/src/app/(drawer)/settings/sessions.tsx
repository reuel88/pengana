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
import { useTheme } from "@/shared/lib/theme";
import {
	outlineButton,
	primaryButtonText,
	themedSurface,
	themedText,
} from "@/shared/styles/shared";
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
		queryFn: async () => {
			const { data } = await authClient.listSessions();
			return Array.isArray(data) ? (data as Session[]) : [];
		},
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
						<Text style={[styles.buttonText, primaryButtonText(theme)]}>
							{t("auth:settings.sessions.revokeAll")}
						</Text>
					</TouchableOpacity>
				) : null}

				{sessions.data?.map((session) => {
					const isCurrent = currentSession?.session.token === session.token;

					return (
						<View
							key={session.token}
							style={[styles.card, themedSurface(theme)]}
						>
							<Text style={[styles.deviceText, themedText(theme)]}>
								{session.userAgent || t("auth:settings.sessions.device")}
							</Text>
							<Text style={[styles.lastActiveText, { color: theme.text }]}>
								{t("auth:settings.sessions.lastActive")}:{" "}
								{new Date(session.updatedAt).toLocaleString()}
							</Text>
							{isCurrent ? (
								<Text style={{ color: theme.primary }}>
									{t("auth:settings.sessions.current")}
								</Text>
							) : (
								<TouchableOpacity
									style={[styles.secondaryButton, outlineButton(theme)]}
									onPress={() => revoke.mutate(session.token)}
								>
									<Text style={themedText(theme)}>
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
		fontWeight: "600",
	},
	deviceText: {
		fontWeight: "600",
	},
	lastActiveText: {
		opacity: 0.7,
	},
	secondaryButton: {
		padding: 10,
		alignItems: "center",
		borderWidth: 1,
	},
});
