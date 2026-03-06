import { useTranslation } from "@pengana/i18n";
import { makeNativeSignInSchema } from "@pengana/i18n/zod";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import {
	ActivityIndicator,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/lib/theme";
import { getErrorMessage } from "@/utils/form-helpers";
import { queryClient } from "@/utils/orpc";

function SignIn() {
	const { theme } = useTheme();
	const [error, setError] = useState<string | null>(null);
	const { t } = useTranslation();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onSubmit: makeNativeSignInSchema(t),
		},
		onSubmit: async ({ value, formApi }) => {
			await authClient.signIn.email(
				{
					email: value.email.trim(),
					password: value.password,
				},
				{
					onError(error) {
						setError(error.error?.message || t("errors:failedToSignIn"));
					},
					onSuccess() {
						setError(null);
						formApi.reset();
						queryClient.refetchQueries();
					},
				},
			);
		},
	});

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: theme.card, borderColor: theme.border },
			]}
		>
			<Text style={[styles.title, { color: theme.text }]}>
				{t("auth:signIn.submit")}
			</Text>

			<form.Subscribe
				selector={(state) => ({
					isSubmitting: state.isSubmitting,
					validationError: getErrorMessage(state.errorMap.onSubmit),
				})}
			>
				{({ isSubmitting, validationError }) => {
					const formError = error ?? validationError;

					return (
						<>
							{formError ? (
								<View
									style={[
										styles.errorContainer,
										{ backgroundColor: `${theme.notification}20` },
									]}
								>
									<Text
										style={[styles.errorText, { color: theme.notification }]}
									>
										{formError}
									</Text>
								</View>
							) : null}

							<form.Field name="email">
								{(field) => (
									<TextInput
										style={[
											styles.input,
											{
												color: theme.text,
												borderColor: theme.border,
												backgroundColor: theme.background,
											},
										]}
										placeholder={t("auth:fields.email")}
										placeholderTextColor={theme.text}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChangeText={(value) => {
											field.handleChange(value);
											if (error) {
												setError(null);
											}
										}}
										keyboardType="email-address"
										autoCapitalize="none"
									/>
								)}
							</form.Field>

							<form.Field name="password">
								{(field) => (
									<TextInput
										style={[
											styles.input,
											{
												color: theme.text,
												borderColor: theme.border,
												backgroundColor: theme.background,
											},
										]}
										placeholder={t("auth:fields.password")}
										placeholderTextColor={theme.text}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChangeText={(value) => {
											field.handleChange(value);
											if (error) {
												setError(null);
											}
										}}
										secureTextEntry
										onSubmitEditing={form.handleSubmit}
									/>
								)}
							</form.Field>

							<TouchableOpacity
								onPress={form.handleSubmit}
								disabled={isSubmitting}
								style={[
									styles.button,
									{
										backgroundColor: theme.primary,
										opacity: isSubmitting ? 0.5 : 1,
									},
								]}
							>
								{isSubmitting ? (
									<ActivityIndicator size="small" color="#ffffff" />
								) : (
									<Text style={styles.buttonText}>
										{t("auth:signIn.submit")}
									</Text>
								)}
							</TouchableOpacity>
						</>
					);
				}}
			</form.Subscribe>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		marginTop: 16,
		padding: 16,
		borderWidth: 1,
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 12,
	},
	errorContainer: {
		marginBottom: 12,
		padding: 8,
	},
	errorText: {
		fontSize: 14,
	},
	input: {
		borderWidth: 1,
		padding: 12,
		fontSize: 16,
		marginBottom: 12,
	},
	button: {
		padding: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	buttonText: {
		color: "#ffffff",
		fontSize: 16,
	},
});

export { SignIn };
