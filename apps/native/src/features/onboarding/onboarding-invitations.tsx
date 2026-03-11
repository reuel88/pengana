import { useTranslation } from "@pengana/i18n";
import { useInvitationActions } from "@pengana/org-client";
import {
	ActivityIndicator,
	Alert,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { useUserInvitations } from "@/shared/hooks/use-org-queries";
import { TEXT_ON_PRIMARY } from "@/shared/lib/design-tokens";
import { useTheme } from "@/shared/lib/theme";
import { mutedText } from "@/shared/styles/shared";

import { onboardingStyles } from "./onboarding-styles";

export function OnboardingInvitations({
	onAccepted,
	onSkipToCreate,
}: {
	onAccepted: () => void;
	onSkipToCreate: () => void;
}) {
	const { t } = useTranslation("onboarding");
	const { theme } = useTheme();
	const { data: invitations } = useUserInvitations();

	const { actingId, handleAccept } = useInvitationActions({
		onAcceptSuccess: onAccepted,
		onError: (message) => Alert.alert(t("invitations.error"), message),
	});

	return (
		<View
			testID="onboarding-invitations"
			style={[
				onboardingStyles.card,
				{ backgroundColor: theme.card, borderColor: theme.border },
			]}
		>
			<Text style={[onboardingStyles.title, { color: theme.text }]}>
				{t("invitations.title")}
			</Text>
			<Text
				style={[
					onboardingStyles.description,
					{ color: theme.text, opacity: 0.6 },
				]}
			>
				{t("invitations.description")}
			</Text>

			{invitations?.map((invitation) => (
				<View
					key={invitation.id}
					style={[styles.invitationRow, { borderColor: theme.border }]}
				>
					<View style={styles.invitationInfo}>
						<Text style={[styles.orgName, { color: theme.text }]}>
							{invitation.organizationName}
						</Text>
						<Text style={[styles.role, mutedText(theme)]}>
							{invitation.role}
						</Text>
					</View>
					<TouchableOpacity
						style={[styles.acceptButton, { backgroundColor: theme.primary }]}
						onPress={() => handleAccept(invitation.id)}
						disabled={actingId !== null}
					>
						{actingId === invitation.id ? (
							<ActivityIndicator size="small" color={TEXT_ON_PRIMARY} />
						) : (
							<Text style={styles.acceptButtonText}>
								{t("invitations.accept")}
							</Text>
						)}
					</TouchableOpacity>
				</View>
			))}

			<TouchableOpacity
				testID="onboarding-create-instead"
				style={onboardingStyles.ghostButton}
				onPress={onSkipToCreate}
				disabled={actingId !== null}
			>
				<Text
					style={[onboardingStyles.ghostButtonText, { color: theme.primary }]}
				>
					{t("invitations.createInstead")}
				</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	invitationRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderWidth: 1,
		padding: 12,
		marginBottom: 8,
	},
	invitationInfo: {
		flex: 1,
	},
	orgName: {
		fontSize: 14,
		fontWeight: "500",
	},
	role: {
		fontSize: 12,
	},
	acceptButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	acceptButtonText: {
		color: TEXT_ON_PRIMARY,
		fontSize: 14,
		fontWeight: "500",
	},
});
