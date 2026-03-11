import { useTranslation } from "@pengana/i18n";
import { Link } from "expo-router";
import { ScrollView, Text } from "react-native";

import { Container } from "@/components/container";
import { SignUp } from "@/components/sign-up";
import { useTheme } from "@/lib/theme";
import { authScreenStyles as styles } from "@/styles/auth";

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
					testID="auth-switch-link"
				>
					<Text style={[styles.linkText, { color: theme.primary }]}>
						{t("auth:signIn.submit")}
					</Text>
				</Link>
			</ScrollView>
		</Container>
	);
}
