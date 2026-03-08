import { useTranslation } from "@pengana/i18n";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { authClient } from "@/lib/auth-client";
import { authMutation } from "@/lib/auth-mutation";
import { useTheme } from "@/lib/theme";

function CreateOrgModal({
	onCreated,
	onBack,
}: {
	onCreated: (orgId: string) => void;
	onBack: () => void;
}) {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [loading, setLoading] = useState(false);

	const handleCreate = () => {
		if (!name) return;
		return authMutation({
			mutationFn: () =>
				authClient.organization.create({
					name,
					slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
				}),
			errorMessage: t("create.error"),
			onSuccess: (data) => {
				if (data) onCreated(data.id);
			},
			setLoading,
		});
	};

	return (
		<View style={styles.createForm}>
			<TextInput
				style={[styles.input, { color: theme.text, borderColor: theme.border }]}
				value={name}
				onChangeText={setName}
				placeholder={t("create.namePlaceholder")}
				placeholderTextColor={theme.border}
			/>
			<TextInput
				style={[styles.input, { color: theme.text, borderColor: theme.border }]}
				value={slug}
				onChangeText={setSlug}
				placeholder={t("create.slugPlaceholder")}
				placeholderTextColor={theme.border}
			/>
			<TouchableOpacity
				style={[styles.button, { backgroundColor: theme.primary }]}
				onPress={handleCreate}
				disabled={loading}
			>
				{loading ? (
					<ActivityIndicator color="#fff" />
				) : (
					<Text style={styles.buttonText}>{t("create.submit")}</Text>
				)}
			</TouchableOpacity>
			<TouchableOpacity onPress={onBack}>
				<Text style={[styles.linkText, { color: theme.primary }]}>
					{t("switcher.back")}
				</Text>
			</TouchableOpacity>
		</View>
	);
}

export function OrgSwitcher() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const { data: orgs, isPending } = authClient.useListOrganizations();
	const { data: activeOrg } = authClient.useActiveOrganization();
	const [showPicker, setShowPicker] = useState(false);
	const [showCreate, setShowCreate] = useState(false);

	if (!session) return null;

	const handleSwitch = async (orgId: string) => {
		await authClient.organization.setActive({ organizationId: orgId });
		setShowPicker(false);
		router.push("/(drawer)/(org)");
	};

	const handleCreated = async (orgId: string) => {
		await authClient.organization.setActive({ organizationId: orgId });
		setShowCreate(false);
		setShowPicker(false);
		router.push("/(drawer)/(org)");
	};

	return (
		<>
			<TouchableOpacity
				style={[styles.trigger, { borderColor: theme.border }]}
				onPress={() => setShowPicker(true)}
			>
				<Text style={[styles.triggerText, { color: theme.text }]}>
					{activeOrg?.name || t("switcher.label")}
				</Text>
			</TouchableOpacity>

			<Modal
				visible={showPicker}
				transparent
				animationType="slide"
				onRequestClose={() => setShowPicker(false)}
			>
				<View style={styles.modalOverlay}>
					<View
						style={[
							styles.modalContent,
							{ backgroundColor: theme.card, borderColor: theme.border },
						]}
					>
						<Text style={[styles.modalTitle, { color: theme.text }]}>
							{t("switcher.label")}
						</Text>

						{showCreate ? (
							<CreateOrgModal
								onCreated={handleCreated}
								onBack={() => setShowCreate(false)}
							/>
						) : (
							<ScrollView style={styles.orgList}>
								{isPending ? (
									<ActivityIndicator />
								) : orgs && orgs.length > 0 ? (
									orgs.map((org) => (
										<TouchableOpacity
											key={org.id}
											style={[
												styles.orgItem,
												{ borderColor: theme.border },
												activeOrg?.id === org.id && {
													backgroundColor: `${theme.primary}20`,
												},
											]}
											onPress={() => handleSwitch(org.id)}
										>
											<Text style={{ color: theme.text }}>{org.name}</Text>
										</TouchableOpacity>
									))
								) : (
									<Text
										style={{ color: theme.text, opacity: 0.5, padding: 16 }}
									>
										{t("switcher.noOrgs")}
									</Text>
								)}
								<TouchableOpacity
									style={[styles.orgItem, { borderColor: theme.border }]}
									onPress={() => setShowCreate(true)}
								>
									<Text style={{ color: theme.primary }}>
										+ {t("switcher.create")}
									</Text>
								</TouchableOpacity>
							</ScrollView>
						)}

						<TouchableOpacity
							style={styles.closeButton}
							onPress={() => {
								setShowPicker(false);
								setShowCreate(false);
							}}
						>
							<Text style={{ color: theme.text }}>{t("switcher.close")}</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	trigger: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderWidth: 1,
	},
	triggerText: {
		fontSize: 14,
	},
	modalOverlay: {
		flex: 1,
		justifyContent: "flex-end",
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	modalContent: {
		maxHeight: "60%",
		padding: 16,
		borderTopWidth: 1,
	},
	modalTitle: {
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 12,
	},
	orgList: {
		maxHeight: 300,
	},
	orgItem: {
		padding: 14,
		borderBottomWidth: 1,
	},
	createForm: {
		gap: 12,
	},
	input: {
		borderWidth: 1,
		padding: 12,
		fontSize: 14,
	},
	button: {
		padding: 12,
		alignItems: "center",
	},
	buttonText: {
		color: "#fff",
		fontWeight: "bold",
	},
	linkText: {
		textAlign: "center",
		padding: 8,
	},
	closeButton: {
		padding: 12,
		alignItems: "center",
		marginTop: 8,
	},
});
