import { useTranslation } from "@pengana/i18n";
import { makeDeleteAccountSchema } from "@pengana/i18n/zod";
import { useZodForm } from "@pengana/org-client";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { queryClient } from "@/shared/api/orpc";
import { authClient } from "@/shared/lib/auth-client";
import { TEXT_ON_PRIMARY } from "@/shared/lib/design-tokens";
import { useTheme } from "@/shared/lib/theme";
import { Container } from "@/shared/ui/container";
import { ThemedTextInput } from "@/shared/ui/themed-text-input";

export default function DeleteAccountScreen() {
	const { t } = useTranslation();
	const { theme } = useTheme();
	const router = useRouter();
	const confirmKeyword = t("auth:settings.deleteAccount.confirmKeyword");

	const form = useZodForm({
		schema: makeDeleteAccountSchema(t, confirmKeyword),
		defaultValues: {
			confirmation: "",
		},
		onSubmit: async () => {
			await authClient.deleteUser(undefined, {
				onSuccess: () => {
					queryClient.clear();
					router.replace("/(auth)/login");
				},
				onError: (err) => {
					Alert.alert(
						t("error:title"),
						err.error.message || t("error:generic"),
					);
				},
			});
		},
	});

	return (
		<Container>
			<View style={styles.container}>
				<Text style={{ color: theme.notification }}>
					{t("auth:settings.deleteAccount.warning")}
				</Text>
				<form.Field name="confirmation">
					{(field) => (
						<ThemedTextInput
							label={t("auth:settings.deleteAccount.confirm", {
								keyword: confirmKeyword,
							})}
							value={field.state.value}
							onChangeText={field.handleChange}
						/>
					)}
				</form.Field>
				<form.Subscribe
					selector={(state) => ({
						canSubmit: state.canSubmit,
						isSubmitting: state.isSubmitting,
					})}
				>
					{(state) => (
						<TouchableOpacity
							style={[
								styles.button,
								{
									backgroundColor: theme.notification,
									opacity: state.canSubmit && !state.isSubmitting ? 1 : 0.5,
								},
							]}
							disabled={!state.canSubmit || state.isSubmitting}
							onPress={form.handleSubmit}
						>
							<Text style={styles.buttonText}>
								{state.isSubmitting
									? t("submitting")
									: t("auth:settings.deleteAccount.submit")}
							</Text>
						</TouchableOpacity>
					)}
				</form.Subscribe>
			</View>
		</Container>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
		gap: 16,
	},
	button: {
		padding: 12,
		alignItems: "center",
	},
	buttonText: {
		color: TEXT_ON_PRIMARY,
		fontWeight: "600",
	},
});
