import { useTranslation } from "@pengana/i18n";
import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/shared/lib/theme";
import { Container } from "@/shared/ui/container";

export default function NotFoundScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation();

	return (
		<>
			<Stack.Screen options={{ title: t("notFound.title") }} />
			<Container>
				<View style={styles.container}>
					<View style={styles.content}>
						<Text style={styles.emoji}>🤔</Text>
						<Text style={[styles.title, { color: theme.text }]}>
							{t("notFound.heading")}
						</Text>
						<Text
							style={[styles.subtitle, { color: theme.text, opacity: 0.7 }]}
						>
							{t("notFound.description")}
						</Text>
						<Link href="/" asChild>
							<Text
								style={StyleSheet.flatten([
									styles.link,
									{
										color: theme.primary,
										backgroundColor: `${theme.primary}1a`,
									},
								])}
							>
								{t("notFound.goHome")}
							</Text>
						</Link>
					</View>
				</View>
			</Container>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 16,
	},
	content: {
		alignItems: "center",
	},
	emoji: {
		fontSize: 48,
		marginBottom: 16,
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 8,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 14,
		textAlign: "center",
		marginBottom: 24,
	},
	link: {
		padding: 12,
	},
});
