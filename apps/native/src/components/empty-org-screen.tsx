import { useTranslation } from "@pengana/i18n";
import { StyleSheet, Text } from "react-native";

import { Container } from "@/components/container";
import { useTheme } from "@/lib/theme";

export function EmptyOrgScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");

	return (
		<Container>
			<Text style={[styles.text, { color: theme.text }]}>
				{t("noActiveOrg")}
			</Text>
		</Container>
	);
}

const styles = StyleSheet.create({
	text: { padding: 16, opacity: 0.5 },
});
