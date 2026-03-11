import { useTranslation } from "@pengana/i18n";
import { Link } from "expo-router";
import { ScrollView, Text } from "react-native";
import { SignIn } from "@/features/auth/sign-in";
import { useTheme } from "@/shared/lib/theme";
import { authScreenStyles as styles } from "@/shared/styles/auth";
import { Container } from "@/shared/ui/container";

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
				<Link
					href="/(auth)/sign-up"
					style={styles.link}
					testID="auth-switch-to-signup-link"
				>
					<Text style={[styles.linkText, { color: theme.primary }]}>
						{t("auth:signUp.title")}
					</Text>
				</Link>
			</ScrollView>
		</Container>
	);
}
