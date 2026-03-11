import { useTranslation } from "@pengana/i18n";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useTheme } from "@/shared/lib/theme";

export function RoleToggle({
	role,
	onChange,
	disabled,
	memberTestID,
	adminTestID,
}: {
	role: "member" | "admin";
	onChange: (role: "member" | "admin") => void;
	disabled?: boolean;
	memberTestID?: string;
	adminTestID?: string;
}) {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");

	return (
		<View style={styles.container}>
			<TouchableOpacity
				testID={memberTestID}
				style={[
					styles.button,
					{
						borderColor: theme.border,
						backgroundColor:
							role === "member" ? `${theme.primary}30` : "transparent",
					},
				]}
				onPress={() => onChange("member")}
				disabled={disabled}
			>
				<Text style={{ color: theme.text }}>{t("roles.member")}</Text>
			</TouchableOpacity>
			<TouchableOpacity
				testID={adminTestID}
				style={[
					styles.button,
					{
						borderColor: theme.border,
						backgroundColor:
							role === "admin" ? `${theme.primary}30` : "transparent",
					},
				]}
				onPress={() => onChange("admin")}
				disabled={disabled}
			>
				<Text style={{ color: theme.text }}>{t("roles.admin")}</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		gap: 8,
	},
	button: {
		flex: 1,
		padding: 10,
		borderWidth: 1,
		alignItems: "center",
	},
});
