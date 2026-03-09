import { useTranslation } from "@pengana/i18n";
import {
	ActivityIndicator,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { useCreateOrg } from "@/hooks/use-create-org";
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

	const { name, setName, slug, setSlug, logo, setLogo, loading, handleSubmit } =
		useCreateOrg({
			errorMessage: t("create.error"),
			onSuccess: () => onCreated(),
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
			<TextInput
				style={[
					styles.input,
					{
						color: theme.text,
						borderColor: theme.border,
						backgroundColor: theme.background,
					},
				]}
				value={name}
				onChangeText={setName}
				placeholder={tOrg("create.namePlaceholder")}
				placeholderTextColor={theme.border}
			/>

			<Text style={[styles.label, { color: theme.text }]}>
				{tOrg("create.slug")}
			</Text>
			<TextInput
				style={[
					styles.input,
					{
						color: theme.text,
						borderColor: theme.border,
						backgroundColor: theme.background,
					},
				]}
				value={slug}
				onChangeText={setSlug}
				placeholder={tOrg("create.slugPlaceholder")}
				placeholderTextColor={theme.border}
			/>

			<Text style={[styles.label, { color: theme.text }]}>
				{tOrg("create.logo")}
			</Text>
			<TextInput
				style={[
					styles.input,
					{
						color: theme.text,
						borderColor: theme.border,
						backgroundColor: theme.background,
					},
				]}
				value={logo}
				onChangeText={setLogo}
				placeholder={tOrg("create.logoPlaceholder")}
				placeholderTextColor={theme.border}
			/>

			<TouchableOpacity
				style={[
					styles.submitButton,
					{
						backgroundColor: theme.primary,
						opacity: loading || !name.trim() ? 0.5 : 1,
					},
				]}
				onPress={handleSubmit}
				disabled={loading || !name.trim()}
			>
				{loading ? (
					<ActivityIndicator size="small" color="#fff" />
				) : (
					<Text style={styles.submitButtonText}>{tOrg("create.submit")}</Text>
				)}
			</TouchableOpacity>

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
