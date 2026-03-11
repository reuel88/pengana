import { useTranslation } from "@pengana/i18n";
import { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/shared/lib/theme";
import { Container } from "@/shared/ui/container";

export default function RolesScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");

	const roles = useMemo(
		() => [
			{
				key: "owner",
				label: t("roles.owner"),
				description: t("roles.ownerDescription"),
			},
			{
				key: "admin",
				label: t("roles.admin"),
				description: t("roles.adminDescription"),
			},
			{
				key: "member",
				label: t("roles.member"),
				description: t("roles.memberDescription"),
			},
		],
		[t],
	);

	return (
		<Container>
			<FlatList
				data={roles}
				keyExtractor={(item) => item.key}
				contentContainerStyle={styles.list}
				ListHeaderComponent={
					<Text style={[styles.headerText, { color: theme.text }]}>
						{t("roles.description")}
					</Text>
				}
				renderItem={({ item }) => (
					<View
						style={[
							styles.roleItem,
							{ borderColor: theme.border, backgroundColor: theme.card },
						]}
					>
						<Text style={[styles.roleName, { color: theme.text }]}>
							{item.label}
						</Text>
						<Text style={[styles.roleDescription, { color: theme.text }]}>
							{item.description}
						</Text>
					</View>
				)}
			/>
		</Container>
	);
}

const styles = StyleSheet.create({
	list: { padding: 16, gap: 8 },
	headerText: { opacity: 0.5, fontSize: 12, marginBottom: 8 },
	roleItem: { padding: 14, borderWidth: 1, gap: 4 },
	roleName: { fontSize: 14, fontWeight: "bold" },
	roleDescription: { opacity: 0.7, fontSize: 12 },
});
