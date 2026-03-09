import { useTranslation } from "@pengana/i18n";
import { Link } from "expo-router";
import { ScrollView, Text } from "react-native";

import { Container } from "@/components/container";
import { SignIn } from "@/components/sign-in";
import { useTheme } from "@/lib/theme";
import { authScreenStyles as styles } from "@/styles/auth";

export default function LoginScreen() {
	const { t } = useTranslation();
	const { theme } = useTheme();

	return (
		<Container>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.content}
			>
				<SignIn />
				<Link href="/(auth)/sign-up" style={styles.link}>
					<Text style={[styles.linkText, { color: theme.primary }]}>
						{t("auth:signUp.title")}
					</Text>
				</Link>
			</ScrollView>
		</Container>
	);
}
