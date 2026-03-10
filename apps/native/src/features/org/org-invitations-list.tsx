import { useTranslation } from "@pengana/i18n";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useTheme } from "@/lib/theme";
import { bodyText, mutedText, secondaryText } from "@/styles/shared";

export function OrgInvitationsList({
	invitations,
	isAdmin,
	isPendingFor,
	onCancel,
}: {
	invitations: Array<{
		id: string;
		email: string;
		role: string;
		status: string;
	}>;
	isAdmin: boolean;
	isPendingFor: (id: string) => boolean;
	onCancel: (id: string) => void;
}) {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");

	return (
		<>
			<Text style={[styles.sectionTitle, bodyText(theme)]}>
				{t("invitations.pending")}
			</Text>
			{invitations.length === 0 ? (
				<Text style={mutedText(theme)}>{t("invitations.noPending")}</Text>
			) : (
				invitations.map((inv) => (
					<View
						key={inv.id}
						style={[
							styles.invItem,
							{ borderColor: theme.border, backgroundColor: theme.card },
						]}
					>
						<View style={{ flex: 1 }}>
							<Text style={bodyText(theme)}>{inv.email}</Text>
							<Text style={secondaryText(theme)}>
								{t(`roles.${inv.role}`, { defaultValue: inv.role })} -{" "}
								{t(`invitations.status.${inv.status}`, {
									defaultValue: inv.status,
								})}
							</Text>
						</View>
						{isAdmin && inv.status === "pending" && (
							<TouchableOpacity
								onPress={() => onCancel(inv.id)}
								disabled={isPendingFor(inv.id)}
								accessibilityRole="button"
								accessibilityLabel={t("invitations.cancel")}
								accessibilityState={{ disabled: isPendingFor(inv.id) }}
								style={[
									styles.cancelButton,
									{ borderColor: theme.border },
									isPendingFor(inv.id) && { opacity: 0.5 },
								]}
							>
								<Text style={[bodyText(theme), { fontSize: 12 }]}>
									{t("invitations.cancel")}
								</Text>
							</TouchableOpacity>
						)}
					</View>
				))
			)}
		</>
	);
}

const styles = StyleSheet.create({
	sectionTitle: { fontSize: 14, fontWeight: "bold" },
	invItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderWidth: 1,
	},
	cancelButton: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
});
