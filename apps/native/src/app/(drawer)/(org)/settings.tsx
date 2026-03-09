import { useTranslation } from "@pengana/i18n";
import { useOrgSettings } from "@pengana/org-client";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { z } from "zod";

import { Container } from "@/components/container";
import { EmptyOrgScreen } from "@/components/empty-org-screen";
import { LoadingScreen } from "@/components/loading-screen";
import { useActiveOrg } from "@/hooks/use-org-queries";
import { useOrgRole } from "@/hooks/use-org-role";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTheme } from "@/lib/theme";
import { inputThemed, mutedText, sharedStyles } from "@/styles/shared";

const updateOrgSchema = z.object({
	name: z.string().min(1),
	slug: z.string(),
	logo: z.string(),
});

export default function OrgSettingsScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const router = useRouter();
	const { data: activeOrg, isPending } = useActiveOrg();
	const { isOwner, isAdmin } = useOrgRole();

	const { updateOrg, deleteOrg, loading } = useOrgSettings({
		onUpdateSuccess: () => Alert.alert("", t("settings.updateSuccess")),
		onDeleteSuccess: async () => {
			router.replace("/");
		},
		onError: (message) => Alert.alert("", message || t("settings.error")),
	});

	const form = useZodForm({
		schema: updateOrgSchema,
		defaultValues: {
			name: activeOrg?.name ?? "",
			slug: activeOrg?.slug ?? "",
			logo: activeOrg?.logo ?? "",
		},
		onSubmit: async ({ value }) => {
			await updateOrg(value);
		},
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: only re-initialize form when switching orgs, not on every field change
	useEffect(() => {
		if (activeOrg) {
			form.reset({
				name: activeOrg.name,
				slug: activeOrg.slug,
				logo: activeOrg.logo ?? "",
			});
		}
	}, [activeOrg?.id]);

	if (isPending) return <LoadingScreen />;
	if (!activeOrg) return <EmptyOrgScreen />;

	const onDelete = () => {
		Alert.alert(t("settings.delete"), t("settings.deleteConfirm"), [
			{ text: t("common:confirm.cancel"), style: "cancel" },
			{
				text: t("settings.delete"),
				style: "destructive",
				onPress: () => deleteOrg(activeOrg.id),
			},
		]);
	};

	return (
		<Container>
			<ScrollView style={styles.scrollView}>
				<View style={styles.content}>
					{isAdmin ? (
						<>
							<form.Field name="name">
								{(field) => (
									<TextInput
										style={[sharedStyles.input, inputThemed(theme)]}
										value={field.state.value}
										onChangeText={field.handleChange}
										onBlur={field.handleBlur}
										placeholder={t("create.namePlaceholder")}
										placeholderTextColor={theme.border}
									/>
								)}
							</form.Field>
							<form.Field name="slug">
								{(field) => (
									<TextInput
										style={[sharedStyles.input, inputThemed(theme)]}
										value={field.state.value}
										onChangeText={field.handleChange}
										onBlur={field.handleBlur}
										placeholder={t("create.slugPlaceholder")}
										placeholderTextColor={theme.border}
									/>
								)}
							</form.Field>
							<form.Field name="logo">
								{(field) => (
									<TextInput
										style={[sharedStyles.input, inputThemed(theme)]}
										value={field.state.value}
										onChangeText={field.handleChange}
										onBlur={field.handleBlur}
										placeholder={t("create.logoPlaceholder")}
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
											sharedStyles.button,
											{ backgroundColor: theme.primary },
										]}
										onPress={form.handleSubmit}
										disabled={loading || isSubmitting || !name.trim()}
									>
										<Text style={sharedStyles.buttonText}>
											{loading ? t("common:submitting") : t("settings.update")}
										</Text>
									</TouchableOpacity>
								)}
							</form.Subscribe>
						</>
					) : (
						<Text style={mutedText(theme)}>{t("settings.title")}</Text>
					)}

					{isOwner && (
						<TouchableOpacity
							style={[
								styles.deleteButton,
								{ backgroundColor: theme.notification },
							]}
							onPress={onDelete}
							disabled={loading}
						>
							<Text style={sharedStyles.buttonText}>
								{t("settings.delete")}
							</Text>
						</TouchableOpacity>
					)}
				</View>
			</ScrollView>
		</Container>
	);
}

const styles = StyleSheet.create({
	scrollView: { flex: 1 },
	content: { padding: 16, gap: 12 },
	deleteButton: { padding: 12, alignItems: "center", marginTop: 24 },
});
