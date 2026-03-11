import { useTranslation } from "@pengana/i18n";
import { Link } from "expo-router";
import { ScrollView, Text } from "react-native";
import { SignUp } from "@/features/auth/sign-up";
import { useTheme } from "@/shared/lib/theme";
import { authScreenStyles as styles } from "@/shared/styles/auth";
import { Container } from "@/shared/ui/container";

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
				<Link
					href="/(auth)/login"
					style={styles.link}
					testID="auth-switch-to-login-link"
				>
					<Text style={[styles.linkText, { color: theme.primary }]}>
						{t("auth:signIn.submit")}
					</Text>
				</Link>
			</ScrollView>
		</Container>
	);
}
