import { useTranslation } from "@pengana/i18n";
import { useState } from "react";
import {
	Alert,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { useInvalidateOrg } from "@/hooks/use-org-queries";
import { authClient } from "@/lib/auth-client";
import { authMutation } from "@/lib/auth-mutation";
import { useTheme } from "@/lib/theme";

export function TeamMemberAddForm({
	teamId,
	members,
}: {
	teamId: string;
	members: Array<{ userId: string; user: { email: string } }> | undefined;
}) {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const { invalidateTeamMembers } = useInvalidateOrg();
	const [memberEmail, setMemberEmail] = useState("");

	const handleAddMember = async () => {
		if (!memberEmail) return;
		const member = members?.find((m) => m.user.email === memberEmail);
		if (!member) {
			Alert.alert(t("teams.error"));
			return;
		}
		await authMutation({
			mutationFn: () =>
				authClient.organization.addTeamMember({
					teamId,
					userId: member.userId,
				}),
			successMessage: t("teams.addMemberSuccess"),
			errorMessage: t("teams.error"),
			onSuccess: () => {
				setMemberEmail("");
				invalidateTeamMembers(teamId);
			},
		});
	};

	return (
		<View style={styles.addRow}>
			<TextInput
				style={[
					styles.input,
					{ flex: 1, color: theme.text, borderColor: theme.border },
				]}
				value={memberEmail}
				onChangeText={setMemberEmail}
				placeholder={t("invitations.emailPlaceholder")}
				placeholderTextColor={theme.border}
				keyboardType="email-address"
				autoCapitalize="none"
			/>
			<TouchableOpacity
				style={[styles.addButton, { backgroundColor: theme.primary }]}
				onPress={handleAddMember}
			>
				<Text style={{ color: "#fff" }}>{t("teams.addMember")}</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	addRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
	input: { borderWidth: 1, padding: 12, fontSize: 14 },
	addButton: { paddingHorizontal: 16, justifyContent: "center" },
});
