import { useTranslation } from "@pengana/i18n";
import { useOrgSettings } from "@pengana/org-client";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { OrgForm } from "@/features/org/org-form";
import { useActiveOrg, useOrgRole } from "@/shared/hooks/use-org-queries";
import { useTheme } from "@/shared/lib/theme";
import { mutedText, sharedStyles } from "@/shared/styles/shared";
import { Container } from "@/shared/ui/container";
import { EmptyOrgScreen } from "@/shared/ui/empty-org-screen";
import { LoadingScreen } from "@/shared/ui/loading-screen";

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

	const orgDefaults = useMemo(
		() =>
			activeOrg
				? {
						name: activeOrg.name,
						slug: activeOrg.slug,
						logo: activeOrg.logo ?? "",
					}
				: undefined,
		[activeOrg?.name, activeOrg?.slug, activeOrg?.logo, activeOrg],
	);

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
						<OrgForm
							defaultValues={orgDefaults}
							onSubmit={updateOrg}
							loading={loading}
							submitLabel={
								loading ? t("common:submitting") : t("settings.update")
							}
						/>
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
