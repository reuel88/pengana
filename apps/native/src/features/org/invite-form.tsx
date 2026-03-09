import { useTranslation } from "@pengana/i18n";
import { useInviteMember } from "@pengana/org-client";
import {
	Alert,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { RoleToggle } from "@/components/role-toggle";
import { useTheme } from "@/lib/theme";
import { inputThemed, sharedStyles } from "@/styles/shared";

export function InviteForm({ orgId }: { orgId: string }) {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");

	const { email, setEmail, role, setRole, handleInvite, loading } =
		useInviteMember({
			onSuccess: () => Alert.alert("", t("invitations.sendSuccess")),
			onError: (message) => Alert.alert("", message || t("invitations.error")),
		});

	return (
		<View style={styles.inviteForm}>
			<TextInput
				style={[sharedStyles.input, inputThemed(theme)]}
				value={email}
				onChangeText={setEmail}
				placeholder={t("invitations.emailPlaceholder")}
				placeholderTextColor={theme.border}
				keyboardType="email-address"
				autoCapitalize="none"
			/>
			<RoleToggle role={role} onChange={setRole} disabled={loading} />
			<TouchableOpacity
				style={[sharedStyles.button, { backgroundColor: theme.primary }]}
				onPress={() => handleInvite(orgId)}
				disabled={loading || !email}
			>
				<Text style={sharedStyles.buttonText}>
					{loading ? t("common:submitting") : t("invitations.send")}
				</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	inviteForm: { gap: 12, marginBottom: 16 },
});
