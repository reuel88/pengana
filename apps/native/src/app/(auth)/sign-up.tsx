import { useTranslation } from "@pengana/i18n";
import { Link, useLocalSearchParams } from "expo-router";
import { ScrollView, Text } from "react-native";
import { SignUp } from "@/features/auth/sign-up";
import { normalizeRedirectTarget } from "@/shared/lib/auth-flow";
import { useTheme } from "@/shared/lib/theme";
import { authScreenStyles as styles } from "@/shared/styles/auth";
import { Container } from "@/shared/ui/container";

export default function SignUpScreen() {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const params = useLocalSearchParams<{
		redirectTo?: string | string[];
		invitationId?: string | string[];
	}>();
	const redirectTo = normalizeRedirectTarget(params.redirectTo);
	const invitationId = normalizeRedirectTarget(params.invitationId);

	return (
		<Container>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.content}
			>
				<SignUp redirectTo={redirectTo} />
				<Link
					href={{
						pathname: "/(auth)/login",
						params: { redirectTo, invitationId },
					}}
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
