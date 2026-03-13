import { useTranslation } from "@pengana/i18n";
import { Link } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@/shared/lib/theme";
import { Container } from "@/shared/ui/container";

export default function SettingsIndexScreen() {
	const { t } = useTranslation();
	const { theme } = useTheme();

	const items = [
		{
			href: "/(drawer)/settings/account",
			label: t("auth:settings.nav.account"),
		},
		{
			href: "/(drawer)/settings/sessions",
			label: t("auth:settings.nav.sessions"),
		},
		{
			href: "/(drawer)/settings/delete-account",
			label: t("auth:settings.nav.deleteAccount"),
		},
	] as const;

	return (
		<Container>
			<View style={styles.container}>
				{items.map((item) => (
					<Link key={item.href} href={item.href} asChild>
						<TouchableOpacity
							style={StyleSheet.flatten([
								styles.item,
								{ backgroundColor: theme.card, borderColor: theme.border },
							])}
						>
							<Text style={{ color: theme.text }}>{item.label}</Text>
						</TouchableOpacity>
					</Link>
				))}
			</View>
		</Container>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
		gap: 12,
	},
	item: {
		padding: 16,
		borderWidth: 1,
	},
});
