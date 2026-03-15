import { useTranslation } from "@pengana/i18n";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/shared/lib/theme";
import { themedText } from "@/shared/styles/shared";

export function ConnectivityBanner({
	isOnline,
	isSyncing,
}: {
	isOnline: boolean;
	isSyncing: boolean;
}) {
	const { theme } = useTheme();
	const { t } = useTranslation("sync");
	const bannerColors = isOnline
		? {
				bg: theme.successSurface,
				text: theme.success,
			}
		: {
				bg: theme.dangerSurface,
				text: theme.danger,
			};

	return (
		<View style={[styles.banner, { backgroundColor: bannerColors.bg }]}>
			<Text
				style={[styles.text, themedText(theme), { color: bannerColors.text }]}
			>
				{isOnline ? (isSyncing ? t("syncing") : t("online")) : t("offline")}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	banner: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		alignItems: "center",
	},
	text: {
		fontSize: 12,
		fontWeight: "500",
	},
});
