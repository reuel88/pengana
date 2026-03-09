import { useTranslation } from "@pengana/i18n";
import { useCreateOrg, useOrgSwitcher } from "@pengana/org-client";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { z } from "zod";
import { useActiveOrg, useListOrgs } from "@/hooks/use-org-queries";
import { useZodForm } from "@/hooks/use-zod-form";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/lib/theme";
import { inputThemed, mutedText, sharedStyles } from "@/styles/shared";

const createOrgSchema = z.object({
	name: z.string().min(1),
	slug: z.string(),
});

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

	const form = useZodForm({
		schema: createOrgSchema,
		defaultValues: { name: "", slug: "" },
		onSubmit: async ({ value }) => {
			await createOrg({ ...value, logo: "" });
		},
	});

	return (
		<View style={styles.createForm}>
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
			<form.Subscribe selector={(s) => ({ isSubmitting: s.isSubmitting })}>
				{({ isSubmitting }) => (
					<TouchableOpacity
						style={[sharedStyles.button, { backgroundColor: theme.primary }]}
						onPress={form.handleSubmit}
						disabled={loading || isSubmitting}
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={sharedStyles.buttonText}>{t("create.submit")}</Text>
						)}
					</TouchableOpacity>
				)}
			</form.Subscribe>
			<TouchableOpacity onPress={onBack} disabled={loading}>
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
	const { data: orgs, isPending } = useListOrgs();
	const { data: activeOrg } = useActiveOrg();
	const [showPicker, setShowPicker] = useState(false);
	const [showCreate, setShowCreate] = useState(false);

	const { handleSwitch, switchingId } = useOrgSwitcher({
		onSwitchSuccess: () => {
			setShowPicker(false);
			router.push("/(drawer)/(org)");
		},
		onError: (message) =>
			Alert.alert(
				t("common:error.title"),
				message || t("switcher.switchError"),
			),
	});

	if (!session) return null;

	const handleCreated = (_orgId: string) => {
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
									<Text style={[mutedText(theme), { padding: 16 }]}>
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
							disabled={switchingId !== null || showCreate}
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
