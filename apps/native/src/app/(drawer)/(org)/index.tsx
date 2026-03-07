import { useTranslation } from "@pengana/i18n";
import { useRouter } from "expo-router";
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { Container } from "@/components/container";
import { OrgSwitcher } from "@/components/org-switcher";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/lib/theme";

export default function OrgIndexScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const { data: activeOrg, isPending } = authClient.useActiveOrganization();
	const router = useRouter();

	const navItems = [
		{ label: t("nav.members"), route: "/(drawer)/(org)/members" },
		{ label: t("nav.invitations"), route: "/(drawer)/(org)/invitations" },
		{ label: t("nav.teams"), route: "/(drawer)/(org)/teams" },
		{ label: t("nav.roles"), route: "/(drawer)/(org)/roles" },
		{ label: t("nav.settings"), route: "/(drawer)/(org)/settings" },
	] as const;

	return (
		<Container>
			<ScrollView style={styles.scrollView}>
				<View style={styles.content}>
					<OrgSwitcher />

					{isPending ? (
						<Text style={[styles.message, { color: theme.text }]}>
							{t("common:status.loading")}
						</Text>
					) : !activeOrg ? (
						<Text style={[styles.message, { color: theme.text, opacity: 0.5 }]}>
							{t("noActiveOrg")}
						</Text>
					) : (
						<>
							<Text style={[styles.orgName, { color: theme.text }]}>
								{activeOrg.name}
							</Text>
							<View style={styles.navList}>
								{navItems.map(({ label, route }) => (
									<TouchableOpacity
										key={route}
										style={[
											styles.navItem,
											{
												borderColor: theme.border,
												backgroundColor: theme.card,
											},
										]}
										onPress={() => router.push(route as any)}
									>
										<Text style={{ color: theme.text }}>{label}</Text>
									</TouchableOpacity>
								))}
							</View>
						</>
					)}
				</View>
			</ScrollView>
		</Container>
	);
}

const styles = StyleSheet.create({
	scrollView: { flex: 1 },
	content: { padding: 16, gap: 16 },
	orgName: { fontSize: 20, fontWeight: "bold" },
	message: { fontSize: 14, marginTop: 16 },
	navList: { gap: 8 },
	navItem: { padding: 16, borderWidth: 1 },
});
