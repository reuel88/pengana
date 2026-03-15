import { useTranslation } from "@pengana/i18n";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/shared/lib/theme";
import { secondaryText, smallPrimaryButtonText } from "@/shared/styles/shared";

export function TeamMemberRow({
	name,
	email,
	isAdmin,
	onRemove,
}: {
	name: string;
	email: string;
	isAdmin: boolean;
	onRemove?: () => void;
}) {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");

	return (
		<View
			style={[
				styles.memberItem,
				{ borderColor: theme.border, backgroundColor: theme.card },
			]}
		>
			<View style={styles.info}>
				<Text style={{ color: theme.text }}>{name}</Text>
				<Text style={secondaryText(theme)}>{email}</Text>
			</View>
			{isAdmin && onRemove && (
				<TouchableOpacity
					accessible
					accessibilityRole="button"
					accessibilityLabel={t("teams.removeMember")}
					accessibilityHint={t("teams.removeMemberHint")}
					onPress={onRemove}
					style={[styles.removeButton, { backgroundColor: theme.notification }]}
				>
					<Text style={smallPrimaryButtonText(theme)}>
						{t("teams.removeMember")}
					</Text>
				</TouchableOpacity>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	memberItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderWidth: 1,
	},
	info: { flex: 1 },
	removeButton: { paddingHorizontal: 12, paddingVertical: 6 },
});
