import { useTranslation } from "@pengana/i18n";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { useActiveOrg, useInvalidateOrg } from "@/hooks/use-org-queries";
import { useOrgRole } from "@/hooks/use-org-role";
import { authClient } from "@/lib/auth-client";
import { authMutation } from "@/lib/auth-mutation";
import { useTheme } from "@/lib/theme";

export default function OrgSettingsScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const router = useRouter();
	const { data: activeOrg, isPending } = useActiveOrg();
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [logo, setLogo] = useState("");
	const [loading, setLoading] = useState(false);
	const { isOwner, isAdmin } = useOrgRole();
	const { invalidateActiveOrg, invalidateAll } = useInvalidateOrg();

	// biome-ignore lint/correctness/useExhaustiveDependencies: only re-initialize form when switching orgs, not on every field change
	useEffect(() => {
		if (!activeOrg) return;
		setName(activeOrg.name);
		setSlug(activeOrg.slug);
		setLogo(activeOrg.logo || "");
	}, [activeOrg?.id]);

	if (isPending) return <LoadingScreen />;
	if (!activeOrg) return <EmptyOrgScreen />;

	const handleUpdate = () =>
		authMutation({
			mutationFn: () =>
				authClient.organization.update({
					data: { name, slug, logo: logo || undefined },
				}),
			successMessage: t("settings.updateSuccess"),
			errorMessage: t("settings.error"),
			onSuccess: () => invalidateActiveOrg(),
			setLoading,
		});

	const handleDelete = () => {
		Alert.alert(t("settings.delete"), t("settings.deleteConfirm"), [
			{ text: t("common:confirm.cancel"), style: "cancel" },
			{
				text: t("settings.delete"),
				style: "destructive",
				onPress: () =>
					authMutation({
						mutationFn: () =>
							authClient.organization.delete({
								organizationId: activeOrg.id,
							}),
						errorMessage: t("settings.error"),
						onSuccess: async () => {
							await invalidateAll();
							router.replace("/");
						},
					}),
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
								style={[
									styles.input,
									{ color: theme.text, borderColor: theme.border },
								]}
								value={name}
								onChangeText={setName}
								placeholder={t("create.namePlaceholder")}
								placeholderTextColor={theme.border}
							/>
							<TextInput
								style={[
									styles.input,
									{ color: theme.text, borderColor: theme.border },
								]}
								value={slug}
								onChangeText={setSlug}
								placeholder={t("create.slugPlaceholder")}
								placeholderTextColor={theme.border}
							/>
							<TextInput
								style={[
									styles.input,
									{ color: theme.text, borderColor: theme.border },
								]}
								value={logo}
								onChangeText={setLogo}
								placeholder={t("create.logoPlaceholder")}
								placeholderTextColor={theme.border}
							/>
							<TouchableOpacity
								style={[styles.button, { backgroundColor: theme.primary }]}
								onPress={handleUpdate}
								disabled={loading}
							>
								<Text style={styles.buttonText}>
									{loading ? t("common:submitting") : t("settings.update")}
								</Text>
							</TouchableOpacity>
						</>
					) : (
						<Text style={{ color: theme.text, opacity: 0.5 }}>
							{t("settings.title")}
						</Text>
					)}

					{isOwner && (
						<TouchableOpacity
							style={[
								styles.deleteButton,
								{ backgroundColor: theme.notification },
							]}
							onPress={handleDelete}
						>
							<Text style={styles.buttonText}>{t("settings.delete")}</Text>
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
	input: { borderWidth: 1, padding: 12, fontSize: 14 },
	button: { padding: 12, alignItems: "center" },
	deleteButton: { padding: 12, alignItems: "center", marginTop: 24 },
	buttonText: { color: "#fff", fontWeight: "bold" },
});
