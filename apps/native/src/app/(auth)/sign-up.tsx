import { useTranslation } from "@pengana/i18n";
import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text } from "react-native";

import { Container } from "@/components/container";
import { SignUp } from "@/components/sign-up";
import { useTheme } from "@/lib/theme";

export default function SignUpScreen() {
	const { t } = useTranslation();
	const { theme } = useTheme();

	return (
		<Container>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.content}
			>
				<SignUp />
				<Link href="/(auth)/login" style={styles.link}>
					<Text style={[styles.linkText, { color: theme.primary }]}>
						{t("auth:signIn.submit")}
					</Text>
				</Link>
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
		justifyContent: "center",
		flexGrow: 1,
	},
	link: {
		alignSelf: "center",
		marginTop: 16,
	},
	linkText: {
		fontSize: 14,
	},
});
