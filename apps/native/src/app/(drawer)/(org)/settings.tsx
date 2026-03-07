import { useTranslation } from "@pengana/i18n";
import { useRouter } from "expo-router";
import { useState } from "react";
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
import { useOrgRole } from "@/hooks/use-org-role";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/lib/theme";

export default function OrgSettingsScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const router = useRouter();
	const { data: activeOrg, isPending } = authClient.useActiveOrganization();
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [logo, setLogo] = useState("");
	const [initialized, setInitialized] = useState(false);
	const [loading, setLoading] = useState(false);
	const { isOwner, isAdmin } = useOrgRole();

	if (isPending) {
		return (
			<Container>
				<Text style={{ color: theme.text, padding: 16 }}>
					{t("common:status.loading")}
				</Text>
			</Container>
		);
	}

	if (!activeOrg) {
		return (
			<Container>
				<Text style={{ color: theme.text, padding: 16, opacity: 0.5 }}>
					{t("noActiveOrg")}
				</Text>
			</Container>
		);
	}

	if (!initialized) {
		setName(activeOrg.name);
		setSlug(activeOrg.slug);
		setLogo(activeOrg.logo || "");
		setInitialized(true);
	}

	const handleUpdate = async () => {
		setLoading(true);
		try {
			const { error } = await authClient.organization.update({
				data: { name, slug, logo: logo || undefined },
			});
			if (error) {
				Alert.alert(t("settings.error"), error.message);
				return;
			}
			Alert.alert(t("settings.updateSuccess"));
		} catch {
			Alert.alert(t("settings.error"));
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = () => {
		Alert.alert(t("settings.delete"), t("settings.deleteConfirm"), [
			{ text: "Cancel", style: "cancel" },
			{
				text: t("settings.delete"),
				style: "destructive",
				onPress: async () => {
					try {
						const { error } = await authClient.organization.delete({
							organizationId: activeOrg.id,
						});
						if (error) {
							Alert.alert(t("settings.error"), error.message);
							return;
						}
						router.replace("/");
					} catch {
						Alert.alert(t("settings.error"));
					}
				},
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
