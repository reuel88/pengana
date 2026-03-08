import { useTranslation } from "@pengana/i18n";
import { FlatList, StyleSheet, Text, View } from "react-native";

import { Container } from "@/components/container";
import { useTheme } from "@/lib/theme";

export default function RolesScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");

	const roles = [
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
	];

	return (
		<Container>
			<FlatList
				data={roles}
				keyExtractor={(item) => item.key}
				contentContainerStyle={styles.list}
				ListHeaderComponent={
					<Text
						style={{
							color: theme.text,
							opacity: 0.5,
							fontSize: 12,
							marginBottom: 8,
						}}
					>
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
						<Text style={{ color: theme.text, opacity: 0.7, fontSize: 12 }}>
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
	roleItem: { padding: 14, borderWidth: 1, gap: 4 },
	roleName: { fontSize: 14, fontWeight: "bold" },
});
