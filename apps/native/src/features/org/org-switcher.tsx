import { useTranslation } from "@pengana/i18n";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { OrgForm } from "@/features/org/org-form";
import { useCreateOrg } from "@/shared/hooks/use-create-org";
import { useActiveOrg, useListOrgs } from "@/shared/hooks/use-org-queries";
import { useOrgSwitcher } from "@/shared/hooks/use-org-switcher";
import { authClient } from "@/shared/lib/auth-client";
import { useTheme } from "@/shared/lib/theme";
import { mutedText } from "@/shared/styles/shared";

function CreateOrgModal({
	onCreated,
	onBack,
}: {
	onCreated: (orgId: string) => void;
	onBack: () => void;
}) {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");

	const { createOrg, loading } = useCreateOrg({
		onSuccess: onCreated,
		onError: (message) => Alert.alert("", message || t("create.error")),
	});

	return (
		<View style={styles.createForm}>
			<OrgForm
				onSubmit={createOrg}
				loading={loading}
				submitLabel={t("create.submit")}
			>
				<TouchableOpacity onPress={onBack} disabled={loading}>
					<Text style={[styles.linkText, { color: theme.primary }]}>
						{t("switcher.back")}
					</Text>
				</TouchableOpacity>
			</OrgForm>
		</View>
	);
}

export function OrgSwitcher() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const { data: orgs, isPending } = useListOrgs();
	const { data: activeOrg } = useActiveOrg();
	const [modal, setModal] = useState<"closed" | "picker" | "create">("closed");

	const { handleSwitch, switchingId } = useOrgSwitcher({
		onSwitchSuccess: () => {
			setModal("closed");
			router.push("/(drawer)/(org)");
		},
		onError: (message) =>
			Alert.alert(
				t("common:error.title"),
				message || t("switcher.switchError"),
			),
	});

	if (!session) return null;

	const handleClose = () => {
		if (switchingId !== null || modal === "create") return;
		setModal("closed");
	};

	const handleCreated = (_orgId: string) => {
		setModal("closed");
		router.push("/(drawer)/(org)");
	};

	return (
		<>
			<TouchableOpacity
				style={[styles.trigger, { borderColor: theme.border }]}
				onPress={() => setModal("picker")}
			>
				<Text style={[styles.triggerText, { color: theme.text }]}>
					{activeOrg?.name || t("switcher.label")}
				</Text>
			</TouchableOpacity>

			<Modal
				visible={modal !== "closed"}
				transparent
				animationType="slide"
				onRequestClose={handleClose}
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

						{modal === "create" ? (
							<CreateOrgModal
								onCreated={handleCreated}
								onBack={() => setModal("picker")}
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
									<Text style={[mutedText(theme), { padding: 16 }]}>
										{t("switcher.noOrgs")}
									</Text>
								)}
								<TouchableOpacity
									style={[styles.orgItem, { borderColor: theme.border }]}
									onPress={() => setModal("create")}
								>
									<Text style={{ color: theme.primary }}>
										+ {t("switcher.create")}
									</Text>
								</TouchableOpacity>
							</ScrollView>
						)}

						<TouchableOpacity
							style={styles.closeButton}
							disabled={switchingId !== null || modal === "create"}
							onPress={handleClose}
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
