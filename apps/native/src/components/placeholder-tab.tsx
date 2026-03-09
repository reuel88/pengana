import { useTranslation } from "@pengana/i18n";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Container } from "@/components/container";
import { useTheme } from "@/lib/theme";

export function PlaceholderTab({
	titleKey,
	subtitleKey,
}: {
	titleKey: string;
	subtitleKey: string;
}) {
	const { theme } = useTheme();
	const { t } = useTranslation("common");

	return (
		<Container>
			<ScrollView style={styles.scrollView}>
				<View style={styles.content}>
					<Text style={[styles.title, { color: theme.text }]}>
						{t(titleKey)}
					</Text>
					<Text style={[styles.subtitle, { color: theme.text }]}>
						{t(subtitleKey)}
					</Text>
				</View>
			</ScrollView>
		</Container>
	);
}

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
		padding: 16,
	},
	content: {
		paddingVertical: 16,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		opacity: 0.7,
	},
});
