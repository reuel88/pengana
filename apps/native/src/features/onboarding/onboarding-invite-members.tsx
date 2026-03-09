import { useTranslation } from "@pengana/i18n";
import { useBatchInvite } from "@pengana/org-client";
import { randomUUID } from "expo-crypto";
import { useEffect } from "react";
import {
	ActivityIndicator,
	Alert,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { RoleToggle } from "@/components/role-toggle";
import { useActiveOrg } from "@/hooks/use-org-queries";
import { useTheme } from "@/lib/theme";

import { onboardingStyles } from "./onboarding-styles";

export function OnboardingInviteMembers({
	onInvited,
	onSkip,
}: {
	onInvited: () => void;
	onSkip: () => void;
}) {
	const { t } = useTranslation("onboarding");
	const { theme } = useTheme();
	const { data: activeOrg } = useActiveOrg();
	const generateId = () => randomUUID();

	const {
		entries,
		addEntry,
		removeEntry,
		updateEntry,
		validEntries,
		handleSubmit,
		loading,
	} = useBatchInvite({
		organizationId: activeOrg?.id,
		onSuccess: () => onInvited(),
		onPartialFailure: () => Alert.alert(t("invite.error")),
		onError: () => Alert.alert(t("invite.error")),
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: seed the first entry on mount
	useEffect(() => {
		if (entries.length === 0) {
			addEntry(generateId());
		}
	}, []);

	return (
		<View
			style={[
				onboardingStyles.card,
				{ backgroundColor: theme.card, borderColor: theme.border },
			]}
		>
			<Text style={[onboardingStyles.title, { color: theme.text }]}>
				{t("invite.title")}
			</Text>
			<Text
				style={[
					onboardingStyles.description,
					{ color: theme.text, opacity: 0.6 },
				]}
			>
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
					<RoleToggle
						role={entry.role}
						onChange={(role) => updateEntry(index, { role })}
						disabled={loading}
					/>
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
				onPress={() => addEntry(generateId())}
			>
				<Text style={[styles.outlineButtonText, { color: theme.text }]}>
					{t("invite.addAnother")}
				</Text>
			</TouchableOpacity>

			<TouchableOpacity
				style={[
					onboardingStyles.submitButton,
					{
						backgroundColor: theme.primary,
						opacity:
							loading || !activeOrg?.id || validEntries.length === 0 ? 0.5 : 1,
					},
				]}
				onPress={handleSubmit}
				disabled={loading || !activeOrg?.id || validEntries.length === 0}
			>
				{loading ? (
					<ActivityIndicator size="small" color="#fff" />
				) : (
					<Text style={onboardingStyles.submitButtonText}>
						{t("invite.send")}
					</Text>
				)}
			</TouchableOpacity>

			<TouchableOpacity style={onboardingStyles.ghostButton} onPress={onSkip}>
				<Text
					style={[onboardingStyles.ghostButtonText, { color: theme.primary }]}
				>
					{t("invite.skip")}
				</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	entryRow: {
		marginBottom: 12,
	},
	emailInput: {
		borderWidth: 1,
		padding: 12,
		fontSize: 14,
		marginBottom: 8,
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
});
