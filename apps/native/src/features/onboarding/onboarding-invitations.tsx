import { useTranslation } from "@pengana/i18n";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { useInvalidateOrg, useUserInvitations } from "@/hooks/use-org-queries";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/lib/theme";

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
	const { invalidateAll } = useInvalidateOrg();
	const [acting, setActing] = useState(false);

	const handleAccept = async (invitationId: string) => {
		setActing(true);
		try {
			const { error } = await authClient.organization.acceptInvitation({
				invitationId,
			});
			if (error) {
				Alert.alert(t("invitations.error"), error.message);
				return;
			}
			await invalidateAll();
			onAccepted();
		} catch {
			Alert.alert(t("invitations.error"));
		} finally {
			setActing(false);
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
				{t("invitations.title")}
			</Text>
			<Text style={[styles.description, { color: theme.text, opacity: 0.6 }]}>
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
						<Text style={[styles.role, { color: theme.text, opacity: 0.5 }]}>
							{invitation.role}
						</Text>
					</View>
					<TouchableOpacity
						style={[styles.acceptButton, { backgroundColor: theme.primary }]}
						onPress={() => handleAccept(invitation.id)}
						disabled={acting}
					>
						{acting ? (
							<ActivityIndicator size="small" color="#fff" />
						) : (
							<Text style={styles.acceptButtonText}>
								{t("invitations.accept")}
							</Text>
						)}
					</TouchableOpacity>
				</View>
			))}

			<TouchableOpacity style={styles.ghostButton} onPress={onSkipToCreate}>
				<Text style={[styles.ghostButtonText, { color: theme.primary }]}>
					{t("invitations.createInstead")}
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
		color: "#fff",
		fontSize: 14,
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
