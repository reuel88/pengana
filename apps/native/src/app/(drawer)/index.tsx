import { useTranslation } from "@pengana/i18n";
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { Container } from "@/components/container";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/lib/theme";
import { queryClient } from "@/utils/orpc";

export default function Home() {
	const { theme } = useTheme();
	const { data: session } = authClient.useSession();
	const { t } = useTranslation();

	return (
		<Container>
			<ScrollView style={styles.scrollView}>
				<View style={styles.content}>
					<View
						style={[
							styles.welcomeCard,
							{ backgroundColor: theme.card, borderColor: theme.border },
						]}
					>
						<Text style={[styles.welcomeText, { color: theme.text }]}>
							{t("dashboard:welcome", { name: session?.user?.name || "" })}
						</Text>
						<Text
							style={[styles.userEmail, { color: theme.text, opacity: 0.7 }]}
						>
							{session?.user?.email}
						</Text>
					</View>

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
	welcomeCard: {
		marginBottom: 16,
		padding: 16,
		borderWidth: 1,
		borderRadius: 8,
	},
	welcomeText: {
		fontSize: 18,
		marginBottom: 4,
	},
	userEmail: {
		fontSize: 14,
		marginTop: 4,
	},
	signOutButton: {
		padding: 12,
		borderRadius: 8,
		alignItems: "center",
	},
	signOutText: {
		color: "#ffffff",
		fontWeight: "bold",
	},
});
