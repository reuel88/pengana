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

import { Container } from "@/components/container";
import { EmptyOrgScreen } from "@/components/empty-org-screen";
import { LoadingScreen } from "@/components/loading-screen";
import { useActiveOrg } from "@/hooks/use-org-queries";
import { useOrgRole } from "@/hooks/use-org-role";
import { useTheme } from "@/lib/theme";
import { inputThemed, mutedText, sharedStyles } from "@/styles/shared";

export default function OrgSettingsScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const router = useRouter();
	const { data: activeOrg, isPending } = useActiveOrg();
	const { isOwner, isAdmin } = useOrgRole();

	const {
		name,
		setName,
		slug,
		setSlug,
		logo,
		setLogo,
		syncFromOrg,
		loading,
		handleUpdate,
		handleDelete,
	} = useOrgSettings({
		onUpdateSuccess: () => Alert.alert("", t("settings.updateSuccess")),
		onDeleteSuccess: async () => {
			router.replace("/");
		},
		onError: (message) => Alert.alert("", message || t("settings.error")),
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: only re-initialize form when switching orgs, not on every field change
	useEffect(() => {
		if (activeOrg) syncFromOrg(activeOrg);
	}, [activeOrg?.id]);

	if (isPending) return <LoadingScreen />;
	if (!activeOrg) return <EmptyOrgScreen />;

	const trimmedName = name.trim();

	const onDelete = () => {
		Alert.alert(t("settings.delete"), t("settings.deleteConfirm"), [
			{ text: t("common:confirm.cancel"), style: "cancel" },
			{
				text: t("settings.delete"),
				style: "destructive",
				onPress: () => handleDelete(activeOrg.id),
			},
		]);
	};

	return (
		<Container>
			<ScrollView style={styles.scrollView}>
				<View style={styles.content}>
					{isAdmin ? (
						<>
							<TextInput
								style={[sharedStyles.input, inputThemed(theme)]}
								value={name}
								onChangeText={setName}
								placeholder={t("create.namePlaceholder")}
								placeholderTextColor={theme.border}
							/>
							<TextInput
								style={[sharedStyles.input, inputThemed(theme)]}
								value={slug}
								onChangeText={setSlug}
								placeholder={t("create.slugPlaceholder")}
								placeholderTextColor={theme.border}
							/>
							<TextInput
								style={[sharedStyles.input, inputThemed(theme)]}
								value={logo}
								onChangeText={setLogo}
								placeholder={t("create.logoPlaceholder")}
								placeholderTextColor={theme.border}
							/>
							<TouchableOpacity
								style={[
									sharedStyles.button,
									{ backgroundColor: theme.primary },
								]}
								onPress={() => handleUpdate()}
								disabled={loading || !trimmedName}
							>
								<Text style={sharedStyles.buttonText}>
									{loading ? t("common:submitting") : t("settings.update")}
								</Text>
							</TouchableOpacity>
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
