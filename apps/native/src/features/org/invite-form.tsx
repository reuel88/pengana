import { useTranslation } from "@pengana/i18n";
import { useState } from "react";
import {
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

export function InviteForm({ orgId }: { orgId: string }) {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<"member" | "admin">("member");
	const [loading, setLoading] = useState(false);
	const { invalidateActiveOrg } = useInvalidateOrg();

	const handleInvite = () => {
		if (!email) return;
		return authMutation({
			mutationFn: () =>
				authClient.organization.inviteMember({
					email,
					role,
					organizationId: orgId,
				}),
			successMessage: t("invitations.sendSuccess"),
			errorMessage: t("invitations.error"),
			onSuccess: () => {
				setEmail("");
				invalidateActiveOrg();
			},
			setLoading,
		});
	};

	return (
		<View style={styles.inviteForm}>
			<TextInput
				style={[styles.input, { color: theme.text, borderColor: theme.border }]}
				value={email}
				onChangeText={setEmail}
				placeholder={t("invitations.emailPlaceholder")}
				placeholderTextColor={theme.border}
				keyboardType="email-address"
				autoCapitalize="none"
			/>
			<View style={styles.roleRow}>
				<TouchableOpacity
					style={[
						styles.roleButton,
						{
							borderColor: theme.border,
							backgroundColor:
								role === "member" ? `${theme.primary}30` : "transparent",
						},
					]}
					onPress={() => setRole("member")}
				>
					<Text style={{ color: theme.text }}>{t("roles.member")}</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[
						styles.roleButton,
						{
							borderColor: theme.border,
							backgroundColor:
								role === "admin" ? `${theme.primary}30` : "transparent",
						},
					]}
					onPress={() => setRole("admin")}
				>
					<Text style={{ color: theme.text }}>{t("roles.admin")}</Text>
				</TouchableOpacity>
			</View>
			<TouchableOpacity
				style={[styles.button, { backgroundColor: theme.primary }]}
				onPress={handleInvite}
				disabled={loading || !email}
			>
				<Text style={styles.buttonText}>
					{loading ? t("common:submitting") : t("invitations.send")}
				</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	inviteForm: { gap: 12, marginBottom: 16 },
	input: { borderWidth: 1, padding: 12, fontSize: 14 },
	roleRow: { flexDirection: "row", gap: 8 },
	roleButton: { flex: 1, padding: 10, borderWidth: 1, alignItems: "center" },
	button: { padding: 12, alignItems: "center" },
	buttonText: { color: "#fff", fontWeight: "bold" },
});
