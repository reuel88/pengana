import { useTranslation } from "@pengana/i18n";
import { Link, useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { SignIn } from "@/features/auth/sign-in";
import { normalizeRedirectTarget } from "@/shared/lib/auth-flow";
import { useTheme } from "@/shared/lib/theme";
import { authScreenStyles as styles } from "@/shared/styles/auth";
import { Container } from "@/shared/ui/container";

export default function LoginScreen() {
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
				<SignIn redirectTo={redirectTo} />
				<View style={styles.links}>
					<Link
						href={{
							pathname: "/(auth)/sign-up",
							params: { redirectTo, invitationId },
						}}
						style={styles.link}
						testID="auth-switch-to-signup-link"
					>
						<Text style={[styles.linkText, { color: theme.primary }]}>
							{t("auth:signUp.title")}
						</Text>
					</Link>
					<Link
						href={{
							pathname: "/(auth)/forgot-password",
							params: { invitationId },
						}}
						style={styles.link}
					>
						<Text style={[styles.linkText, { color: theme.primary }]}>
							{t("auth:signIn.forgotPassword")}
						</Text>
					</Link>
				</View>
			</ScrollView>
		</Container>
	);
}
