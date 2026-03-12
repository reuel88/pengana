import { useTranslation } from "@pengana/i18n";
import { StyleSheet, Text, View } from "react-native";

import { BANNER_COLORS } from "@/shared/lib/design-tokens";
import { useTheme } from "@/shared/lib/theme";

export function ConnectivityBanner({
	isOnline,
	isSyncing,
}: {
	isOnline: boolean;
	isSyncing: boolean;
}) {
	const { colorScheme } = useTheme();
	const { t } = useTranslation("sync");

	const isDark = colorScheme === "dark";
	const bannerColors = isOnline
		? {
				bg: BANNER_COLORS.onlineBg,
				text: isDark
					? BANNER_COLORS.onlineTextDark
					: BANNER_COLORS.onlineTextLight,
			}
		: {
				bg: BANNER_COLORS.offlineBg,
				text: isDark
					? BANNER_COLORS.offlineTextDark
					: BANNER_COLORS.offlineTextLight,
			};

	return (
		<View style={[styles.banner, { backgroundColor: bannerColors.bg }]}>
			<Text style={[styles.text, { color: bannerColors.text }]}>
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
