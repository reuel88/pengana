import { useTranslation } from "@pengana/i18n";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { useInvalidateOrg } from "@/hooks/use-org-queries";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/lib/theme";

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
	const { invalidateAll } = useInvalidateOrg();
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [logo, setLogo] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		const trimmedName = name.trim();
		const trimmedSlug = slug.trim();
		if (!trimmedName) return;

		setLoading(true);
		try {
			const { data: org, error: createError } =
				await authClient.organization.create({
					name: trimmedName,
					slug: trimmedSlug || trimmedName.toLowerCase().replace(/\s+/g, "-"),
					logo: logo.trim() || undefined,
				});
			if (createError || !org) {
				Alert.alert(createError?.message || t("create.error"));
				return;
			}

			const { error: setActiveError } = await authClient.organization.setActive(
				{
					organizationId: org.id,
				},
			);
			if (setActiveError) {
				Alert.alert(setActiveError.message || t("create.error"));
				return;
			}

			await invalidateAll();
			onCreated();
		} catch {
			Alert.alert(t("create.error"));
		} finally {
			setLoading(false);
		}
	};

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

const styles = StyleSheet.create({
	card: {
		padding: 16,
		borderWidth: 1,
		width: "100%",
	},
	title: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 4,
	},
	description: {
		fontSize: 14,
		marginBottom: 16,
	},
	label: {
		fontSize: 14,
		fontWeight: "500",
		marginBottom: 4,
	},
	input: {
		borderWidth: 1,
		padding: 12,
		fontSize: 16,
		marginBottom: 12,
	},
	submitButton: {
		padding: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	submitButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "500",
	},
	ghostButton: {
		padding: 12,
		alignItems: "center",
		marginTop: 8,
	},
	ghostButtonText: {
		fontSize: 14,
	},
});
