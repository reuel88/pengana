import { useTranslation } from "@pengana/i18n";
import { ActivityIndicator, Text, View } from "react-native";

import { Container } from "@/components/container";
import { useTheme } from "@/lib/theme";

export function LoadingScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation();

	return (
		<Container>
			<View style={{ padding: 16, alignItems: "center", gap: 8 }}>
				<ActivityIndicator size="large" color={theme.primary} />
				<Text style={{ color: theme.text }}>{t("common:status.loading")}</Text>
			</View>
		</Container>
	);
}
