import { useTranslation } from "@pengana/i18n";
import { Text } from "react-native";

import { Container } from "@/components/container";
import { useTheme } from "@/lib/theme";

export function LoadingScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation();

	return (
		<Container>
			<Text style={{ color: theme.text, padding: 16 }}>
				{t("common:status.loading")}
			</Text>
		</Container>
	);
}
