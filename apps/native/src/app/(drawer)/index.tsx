import { useTranslation } from "@pengana/i18n";
import { useQuery } from "@tanstack/react-query";
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { Container } from "@/components/container";
import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { authClient } from "@/lib/auth-client";
import { STATUS_COLORS } from "@/lib/design-tokens";
import { useTheme } from "@/lib/theme";
import { orpc, queryClient } from "@/utils/orpc";

export default function Home() {
	const { theme } = useTheme();
	const healthCheck = useQuery(orpc.healthCheck.queryOptions());
	const privateData = useQuery(orpc.privateData.queryOptions());
	const isConnected = healthCheck?.data === "OK";
	const isLoading = healthCheck?.isLoading;
	const { data: session } = authClient.useSession();
	const { t } = useTranslation();

	return (
		<Container>
			<ScrollView style={styles.scrollView}>
				<View style={styles.content}>
					<Text style={[styles.title, { color: theme.text }]}>
						BETTER T STACK
					</Text>

					{session?.user ? (
						<View
							style={[
								styles.userCard,
								{ backgroundColor: theme.card, borderColor: theme.border },
							]}
						>
							<View style={styles.userHeader}>
								<Text style={[styles.userText, { color: theme.text }]}>
									{t("dashboard:welcome", { name: "" })}
									<Text style={styles.userName}>{session.user.name}</Text>
								</Text>
							</View>
							<Text
								style={[styles.userEmail, { color: theme.text, opacity: 0.7 }]}
							>
								{session.user.email}
							</Text>
							<TouchableOpacity
								style={[
									styles.signOutButton,
									{ backgroundColor: theme.notification },
								]}
								onPress={() => {
									authClient.signOut();
									queryClient.invalidateQueries();
								}}
							>
								<Text style={styles.signOutText}>{t("user.signOut")}</Text>
							</TouchableOpacity>
						</View>
					) : null}

					<View
						style={[
							styles.statusCard,
							{ backgroundColor: theme.card, borderColor: theme.border },
						]}
					>
						<Text style={[styles.cardTitle, { color: theme.text }]}>
							{t("systemStatus")}
						</Text>
						<View style={styles.statusRow}>
							<View
								style={[
									styles.statusIndicator,
									{
										backgroundColor: isConnected
											? STATUS_COLORS.connected
											: STATUS_COLORS.error,
									},
								]}
							/>
							<View style={styles.statusContent}>
								<Text style={[styles.statusTitle, { color: theme.text }]}>
									{t("orpcBackend")}
								</Text>
								<Text
									style={[
										styles.statusText,
										{ color: theme.text, opacity: 0.7 },
									]}
								>
									{isLoading
										? t("status.checkingConnection")
										: isConnected
											? t("status.connectedToApi")
											: t("status.apiDisconnected")}
								</Text>
							</View>
						</View>
					</View>

					<View
						style={[
							styles.privateDataCard,
							{ backgroundColor: theme.card, borderColor: theme.border },
						]}
					>
						<Text style={[styles.cardTitle, { color: theme.text }]}>
							{t("privateData")}
						</Text>
						{privateData.data && (
							<Text
								style={[
									styles.privateDataText,
									{ color: theme.text, opacity: 0.7 },
								]}
							>
								{privateData.data?.message}
							</Text>
						)}
					</View>

					{!session?.user && (
						<>
							<SignIn />
							<SignUp />
						</>
					)}
				</View>
			</ScrollView>
		</Container>
	);
}

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
	},
	content: {
		padding: 16,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 16,
	},
	userCard: {
		marginBottom: 16,
		padding: 16,
		borderWidth: 1,
	},
	userHeader: {
		marginBottom: 8,
	},
	userText: {
		fontSize: 16,
	},
	userName: {
		fontWeight: "bold",
	},
	userEmail: {
		fontSize: 14,
		marginBottom: 12,
	},
	signOutButton: {
		padding: 12,
	},
	signOutText: {
		color: "#ffffff",
	},
	statusCard: {
		marginBottom: 16,
		padding: 16,
		borderWidth: 1,
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 12,
	},
	statusRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	statusIndicator: {
		height: 8,
		width: 8,
	},
	statusContent: {
		flex: 1,
	},
	statusTitle: {
		fontSize: 14,
		fontWeight: "bold",
	},
	statusText: {
		fontSize: 12,
	},
	privateDataCard: {
		marginBottom: 16,
		padding: 16,
		borderWidth: 1,
	},
	privateDataText: {
		fontSize: 14,
	},
});
