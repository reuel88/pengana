import { useTranslation } from "@pengana/i18n";
import { StyleSheet, Text, View } from "react-native";

import { BANNER_COLORS } from "@/lib/design-tokens";
import { useTheme } from "@/lib/theme";

export function ConnectivityBanner({
	isOnline,
	isSyncing,
}: {
	isOnline: boolean;
	isSyncing: boolean;
}) {
	const { colorScheme } = useTheme();
	const { t } = useTranslation("sync");

	const backgroundColor = isOnline
		? BANNER_COLORS.onlineBg
		: BANNER_COLORS.offlineBg;
	const textColor = isOnline
		? colorScheme === "dark"
			? BANNER_COLORS.onlineTextDark
			: BANNER_COLORS.onlineTextLight
		: colorScheme === "dark"
			? BANNER_COLORS.offlineTextDark
			: BANNER_COLORS.offlineTextLight;

	return (
		<View style={[styles.banner, { backgroundColor }]}>
			<Text style={[styles.text, { color: textColor }]}>
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
