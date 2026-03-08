import { useTranslation } from "@pengana/i18n";
import { useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { useActiveOrg } from "@/hooks/use-org-queries";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/lib/theme";

interface InviteEntry {
	id: string;
	email: string;
	role: "member" | "admin";
}

export function OnboardingInviteMembers({
	onInvited,
	onSkip,
}: {
	onInvited: () => void;
	onSkip: () => void;
}) {
	const { t } = useTranslation("onboarding");
	const { t: tOrg } = useTranslation("organization");
	const { theme } = useTheme();
	const { data: activeOrg } = useActiveOrg();
	const entryCounter = useRef(0);

	const generateId = () => {
		return `entry-${++entryCounter.current}-${Date.now()}`;
	};

	const [entries, setEntries] = useState<InviteEntry[]>([
		{ id: generateId(), email: "", role: "member" },
	]);
	const [loading, setLoading] = useState(false);

	const updateEntry = (index: number, updates: Partial<InviteEntry>) => {
		setEntries((prev) =>
			prev.map((entry, i) => (i === index ? { ...entry, ...updates } : entry)),
		);
	};

	const addEntry = () => {
		setEntries((prev) => [
			...prev,
			{ id: generateId(), email: "", role: "member" },
		]);
	};

	const removeEntry = (index: number) => {
		setEntries((prev) => prev.filter((_, i) => i !== index));
	};

	const validEntries = entries.filter((e) => e.email.trim() !== "");

	const handleSubmit = async () => {
		if (!activeOrg || validEntries.length === 0) return;

		setLoading(true);
		try {
			const results = await Promise.allSettled(
				validEntries.map(async (entry) => {
					const { error } = await authClient.organization.inviteMember({
						email: entry.email.trim(),
						role: entry.role,
						organizationId: activeOrg.id,
					});
					if (error) throw error;
				}),
			);

			const failed = results.filter((r) => r.status === "rejected");
			if (failed.length > 0) {
				Alert.alert(t("invite.error"));
			}
			if (failed.length < results.length) {
				onInvited();
			}
		} catch {
			Alert.alert(t("invite.error"));
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
				{t("invite.title")}
			</Text>
			<Text style={[styles.description, { color: theme.text, opacity: 0.6 }]}>
				{t("invite.description")}
			</Text>

			{entries.map((entry, index) => (
				<View key={entry.id} style={styles.entryRow}>
					<TextInput
						style={[
							styles.emailInput,
							{
								color: theme.text,
								borderColor: theme.border,
								backgroundColor: theme.background,
							},
						]}
						value={entry.email}
						onChangeText={(text) => updateEntry(index, { email: text })}
						placeholder={t("invite.emailPlaceholder")}
						placeholderTextColor={theme.border}
						keyboardType="email-address"
						autoCapitalize="none"
					/>
					<View style={styles.roleToggle}>
						<TouchableOpacity
							style={[
								styles.roleButton,
								{
									borderColor: theme.border,
									backgroundColor:
										entry.role === "member" ? theme.primary : theme.background,
								},
							]}
							onPress={() => updateEntry(index, { role: "member" })}
						>
							<Text
								style={{
									color: entry.role === "member" ? "#fff" : theme.text,
									fontSize: 12,
								}}
							>
								{tOrg("roles.member")}
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[
								styles.roleButton,
								{
									borderColor: theme.border,
									backgroundColor:
										entry.role === "admin" ? theme.primary : theme.background,
								},
							]}
							onPress={() => updateEntry(index, { role: "admin" })}
						>
							<Text
								style={{
									color: entry.role === "admin" ? "#fff" : theme.text,
									fontSize: 12,
								}}
							>
								{tOrg("roles.admin")}
							</Text>
						</TouchableOpacity>
					</View>
					{entries.length > 1 && (
						<TouchableOpacity
							style={styles.removeButton}
							onPress={() => removeEntry(index)}
						>
							<Text style={{ color: theme.notification, fontSize: 12 }}>
								{t("invite.remove")}
							</Text>
						</TouchableOpacity>
					)}
				</View>
			))}

			<TouchableOpacity
				style={[styles.outlineButton, { borderColor: theme.border }]}
				onPress={addEntry}
			>
				<Text style={[styles.outlineButtonText, { color: theme.text }]}>
					{t("invite.addAnother")}
				</Text>
			</TouchableOpacity>

			<TouchableOpacity
				style={[
					styles.submitButton,
					{
						backgroundColor: theme.primary,
						opacity: loading || validEntries.length === 0 ? 0.5 : 1,
					},
				]}
				onPress={handleSubmit}
				disabled={loading || validEntries.length === 0}
			>
				{loading ? (
					<ActivityIndicator size="small" color="#fff" />
				) : (
					<Text style={styles.submitButtonText}>{t("invite.send")}</Text>
				)}
			</TouchableOpacity>

			<TouchableOpacity style={styles.ghostButton} onPress={onSkip}>
				<Text style={[styles.ghostButtonText, { color: theme.primary }]}>
					{t("invite.skip")}
				</Text>
			</TouchableOpacity>
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
	entryRow: {
		marginBottom: 12,
	},
	emailInput: {
		borderWidth: 1,
		padding: 12,
		fontSize: 14,
		marginBottom: 8,
	},
	roleToggle: {
		flexDirection: "row",
		gap: 8,
		marginBottom: 4,
	},
	roleButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderWidth: 1,
	},
	removeButton: {
		paddingVertical: 4,
		alignItems: "flex-end",
	},
	outlineButton: {
		padding: 12,
		alignItems: "center",
		borderWidth: 1,
		marginBottom: 8,
	},
	outlineButtonText: {
		fontSize: 14,
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
