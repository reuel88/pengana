import { useTranslation } from "@pengana/i18n";
import {
	isOrgDesignPresetEqual,
	normalizeOrgDesignPreset,
	ORG_ACCENT_THEME_OPTIONS,
	ORG_BASE_COLOR_OPTIONS,
	ORG_FONT_OPTIONS,
	ORG_ICON_LIBRARY_OPTIONS,
	ORG_MENU_ACCENT_OPTIONS,
	ORG_MENU_OPTIONS,
	ORG_RADIUS_OPTIONS,
	ORG_STYLE_OPTIONS,
	type OrgDesignPreset,
	useOrgSettings,
} from "@pengana/org-client";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import { useOrgDesignPresetPreview } from "@/shared/lib/org-design-preset-preview";
import { useTheme } from "@/shared/lib/theme";
import {
	mutedText,
	primaryButton,
	primaryButtonText,
	sharedStyles,
} from "@/shared/styles/shared";
import { Container } from "@/shared/ui/container";
import { EmptyOrgScreen } from "@/shared/ui/empty-org-screen";
import { LoadingScreen } from "@/shared/ui/loading-screen";

export default function OrgSettingsScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const router = useRouter();
	const { data: activeOrg, isPending } = useActiveOrg();
	const { isOwner, isAdmin } = useOrgRole();
	const { setPreviewDesignPreset } = useOrgDesignPresetPreview();
	const canEditAppearance = isOwner || isAdmin;

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
		[activeOrg],
	);
	const [designPreset, setDesignPreset] = useState<OrgDesignPreset>(
		normalizeOrgDesignPreset(activeOrg?.designPreset),
	);

	useEffect(() => {
		setDesignPreset(normalizeOrgDesignPreset(activeOrg?.designPreset));
	}, [activeOrg?.designPreset]);

	useEffect(() => {
		if (!activeOrg || !canEditAppearance) return;
		setPreviewDesignPreset(designPreset);

		return () => {
			setPreviewDesignPreset(null);
		};
	}, [activeOrg, canEditAppearance, designPreset, setPreviewDesignPreset]);

	if (isPending) return <LoadingScreen />;
	if (!activeOrg) return <EmptyOrgScreen />;

	const currentPreset = normalizeOrgDesignPreset(activeOrg.designPreset);
	const designPresetChanged = !isOrgDesignPresetEqual(
		currentPreset,
		designPreset,
	);

	const sections = [
		{
			key: "style",
			label: t("settings.appearance.style"),
			options: ORG_STYLE_OPTIONS,
		},
		{
			key: "baseColor",
			label: t("settings.appearance.baseColor"),
			options: ORG_BASE_COLOR_OPTIONS,
		},
		{
			key: "accentTheme",
			label: t("settings.appearance.accentTheme"),
			options: ORG_ACCENT_THEME_OPTIONS,
		},
		{
			key: "iconLibrary",
			label: t("settings.appearance.iconLibrary"),
			options: ORG_ICON_LIBRARY_OPTIONS,
		},
		{
			key: "font",
			label: t("settings.appearance.font"),
			options: ORG_FONT_OPTIONS,
		},
		{
			key: "radius",
			label: t("settings.appearance.radius"),
			options: ORG_RADIUS_OPTIONS,
		},
		{
			key: "menu",
			label: t("settings.appearance.menu"),
			options: ORG_MENU_OPTIONS,
		},
		{
			key: "menuAccent",
			label: t("settings.appearance.menuAccent"),
			options: ORG_MENU_ACCENT_OPTIONS,
		},
	] as const;

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

					<View
						style={[
							styles.section,
							{ backgroundColor: theme.card, borderColor: theme.border },
						]}
					>
						<Text style={[styles.sectionTitle, { color: theme.text }]}>
							{t("settings.appearance.title")}
						</Text>
						<Text style={[styles.sectionDescription, mutedText(theme)]}>
							{t("settings.appearance.description")}
						</Text>
						{sections.map((section) => (
							<View key={section.key} style={styles.group}>
								<Text style={[styles.groupTitle, { color: theme.text }]}>
									{section.label}
								</Text>
								<View style={styles.optionList}>
									{section.options.map((option) => {
										const selected = designPreset[section.key] === option.id;
										return (
											<TouchableOpacity
												key={option.id}
												style={[
													styles.optionCard,
													{
														backgroundColor: theme.background,
														borderColor: selected
															? theme.primary
															: theme.border,
														opacity: !canEditAppearance ? 0.85 : 1,
													},
												]}
												onPress={() => {
													if (!canEditAppearance) return;
													setDesignPreset((current) => ({
														...current,
														[section.key]: option.id,
													}));
												}}
												disabled={!canEditAppearance}
											>
												<Text
													style={[styles.optionTitle, { color: theme.text }]}
												>
													{option.label}
												</Text>
												<Text style={mutedText(theme)}>
													{option.description}
												</Text>
											</TouchableOpacity>
										);
									})}
								</View>
							</View>
						))}
						{canEditAppearance && (
							<TouchableOpacity
								style={[
									sharedStyles.button,
									primaryButton(theme, {
										disabled: loading || !designPresetChanged,
									}),
								]}
								onPress={() => void updateOrg({ designPreset })}
								disabled={loading || !designPresetChanged}
							>
								<Text style={primaryButtonText(theme)}>
									{t("settings.appearance.save")}
								</Text>
							</TouchableOpacity>
						)}
					</View>

					{isOwner && (
						<TouchableOpacity
							style={[
								styles.deleteButton,
								{ backgroundColor: theme.notification },
							]}
							onPress={onDelete}
							disabled={loading}
						>
							<Text style={primaryButtonText(theme)}>
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
	section: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 12 },
	sectionTitle: { fontSize: 14, fontWeight: "600" },
	sectionDescription: { fontSize: 12 },
	group: { gap: 8 },
	groupTitle: { fontSize: 13, fontWeight: "600" },
	optionList: { gap: 8 },
	optionCard: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 4 },
	optionTitle: { fontSize: 13, fontWeight: "600" },
	deleteButton: { padding: 12, alignItems: "center", marginTop: 24 },
});
