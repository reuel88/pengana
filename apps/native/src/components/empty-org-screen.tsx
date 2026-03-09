import { useTranslation } from "@pengana/i18n";
import { Text } from "react-native";

import { Container } from "@/components/container";
import { useTheme } from "@/lib/theme";

export function EmptyOrgScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");

	return (
		<Container>
			<Text style={{ color: theme.text, padding: 16, opacity: 0.5 }}>
				{t("noActiveOrg")}
			</Text>
		</Container>
	);
}
