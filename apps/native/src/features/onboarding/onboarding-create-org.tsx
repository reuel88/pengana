import { useTranslation } from "@pengana/i18n";
import { createOrgSchema, useCreateOrg, useZodForm } from "@pengana/org-client";
import {
	ActivityIndicator,
	Alert,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { TEXT_ON_PRIMARY } from "@/lib/design-tokens";
import { useTheme } from "@/lib/theme";

import { onboardingStyles as styles } from "./onboarding-styles";

export function OnboardingCreateOrg({
	onCreated,
	onBackToInvitations,
}: {
	onCreated: () => void;
	onBackToInvitations?: () => void;
}) {
	const { t } = useTranslation("onboarding");
	const { t: tOrg } = useTranslation("organization");
	const { theme } = useTheme();

	const { createOrg, loading } = useCreateOrg({
		onSuccess: () => onCreated(),
		onError: (message) => Alert.alert("", message || t("create.error")),
	});

	const form = useZodForm({
		schema: createOrgSchema,
		defaultValues: { name: "", slug: "", logo: "" },
		onSubmit: async ({ value }) => {
			await createOrg(value);
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
				{t("create.title")}
			</Text>
			<Text style={[styles.description, { color: theme.text, opacity: 0.6 }]}>
				{t("create.description")}
			</Text>

			<Text style={[styles.label, { color: theme.text }]}>
				{tOrg("create.name")}
			</Text>
			<form.Field name="name">
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
						value={field.state.value}
						onChangeText={field.handleChange}
						onBlur={field.handleBlur}
						placeholder={tOrg("create.namePlaceholder")}
						placeholderTextColor={theme.border}
					/>
				)}
			</form.Field>

			<Text style={[styles.label, { color: theme.text }]}>
				{tOrg("create.slug")}
			</Text>
			<form.Field name="slug">
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
						value={field.state.value}
						onChangeText={field.handleChange}
						onBlur={field.handleBlur}
						placeholder={tOrg("create.slugPlaceholder")}
						placeholderTextColor={theme.border}
					/>
				)}
			</form.Field>

			<Text style={[styles.label, { color: theme.text }]}>
				{tOrg("create.logo")}
			</Text>
			<form.Field name="logo">
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
						value={field.state.value}
						onChangeText={field.handleChange}
						onBlur={field.handleBlur}
						placeholder={tOrg("create.logoPlaceholder")}
						placeholderTextColor={theme.border}
					/>
				)}
			</form.Field>

			<form.Subscribe
				selector={(s) => ({
					isSubmitting: s.isSubmitting,
					name: s.values.name,
				})}
			>
				{({ isSubmitting, name }) => (
					<TouchableOpacity
						style={[
							styles.submitButton,
							{
								backgroundColor: theme.primary,
								opacity: isSubmitting || loading || !name.trim() ? 0.5 : 1,
							},
						]}
						onPress={form.handleSubmit}
						disabled={isSubmitting || loading || !name.trim()}
					>
						{loading ? (
							<ActivityIndicator size="small" color={TEXT_ON_PRIMARY} />
						) : (
							<Text style={styles.submitButtonText}>
								{tOrg("create.submit")}
							</Text>
						)}
					</TouchableOpacity>
				)}
			</form.Subscribe>

			{onBackToInvitations && (
				<TouchableOpacity
					style={styles.ghostButton}
					onPress={onBackToInvitations}
				>
					<Text style={[styles.ghostButtonText, { color: theme.primary }]}>
						{t("create.backToInvitations")}
					</Text>
				</TouchableOpacity>
			)}
		</View>
	);
}
