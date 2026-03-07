import { useTranslation } from "@pengana/i18n";
import { useRouter } from "expo-router";
import {
	Alert,
	FlatList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { Container } from "@/components/container";
import { useOrgRole } from "@/hooks/use-org-role";
import { authClient } from "@/lib/auth-client";
import { useTheme } from "@/lib/theme";

export default function MembersScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const router = useRouter();
	const { data: activeOrg, isPending } = authClient.useActiveOrganization();
	const { data: session } = authClient.useSession();
	const currentUserId = session?.user?.id;
	const { isAdmin } = useOrgRole();

	if (isPending) {
		return (
			<Container>
				<Text style={{ color: theme.text, padding: 16 }}>
					{t("common:status.loading")}
				</Text>
			</Container>
		);
	}

	if (!activeOrg) {
		return (
			<Container>
				<Text style={{ color: theme.text, padding: 16, opacity: 0.5 }}>
					{t("noActiveOrg")}
				</Text>
			</Container>
		);
	}

	const members = activeOrg.members || [];

	const handleRemove = (memberId: string) => {
		Alert.alert(t("members.remove"), t("members.removeConfirm"), [
			{ text: "Cancel", style: "cancel" },
			{
				text: t("members.remove"),
				style: "destructive",
				onPress: async () => {
					const { error } = await authClient.organization.removeMember({
						memberIdOrEmail: memberId,
					});
					if (error) Alert.alert(t("members.error"), error.message);
				},
			},
		]);
	};

	const handleLeave = () => {
		Alert.alert(t("members.leave"), t("members.leaveConfirm"), [
			{ text: "Cancel", style: "cancel" },
			{
				text: t("members.leave"),
				style: "destructive",
				onPress: async () => {
					const { error } = await authClient.organization.removeMember({
						memberIdOrEmail: currentUserId ?? "",
					});
					if (error) {
						Alert.alert(t("members.error"), error.message);
						return;
					}
					router.replace("/");
				},
			},
		]);
	};

	return (
		<Container>
			<FlatList
				data={members}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.list}
				ListHeaderComponent={
					<TouchableOpacity
						style={[
							styles.leaveButton,
							{ backgroundColor: theme.notification },
						]}
						onPress={handleLeave}
					>
						<Text style={styles.leaveText}>{t("members.leave")}</Text>
					</TouchableOpacity>
				}
				ListEmptyComponent={
					<Text style={{ color: theme.text, opacity: 0.5 }}>
						{t("members.noMembers")}
					</Text>
				}
				renderItem={({ item: member }) => (
					<View
						style={[
							styles.memberItem,
							{ borderColor: theme.border, backgroundColor: theme.card },
						]}
					>
						<View style={styles.memberInfo}>
							<Text style={[styles.memberName, { color: theme.text }]}>
								{member.user.name}
							</Text>
							<Text style={{ color: theme.text, opacity: 0.7, fontSize: 12 }}>
								{member.user.email}
							</Text>
							<Text style={{ color: theme.primary, fontSize: 12 }}>
								{member.role}
							</Text>
						</View>
						{isAdmin &&
							member.userId !== currentUserId &&
							member.role !== "owner" && (
								<TouchableOpacity
									onPress={() => handleRemove(member.id)}
									style={[
										styles.removeButton,
										{ backgroundColor: theme.notification },
									]}
								>
									<Text style={{ color: "#fff", fontSize: 12 }}>
										{t("members.remove")}
									</Text>
								</TouchableOpacity>
							)}
					</View>
				)}
			/>
		</Container>
	);
}

const styles = StyleSheet.create({
	list: { padding: 16, gap: 8 },
	memberItem: {
		flexDirection: "row",
		alignItems: "center",
		padding: 12,
		borderWidth: 1,
	},
	memberInfo: { flex: 1, gap: 2 },
	memberName: { fontSize: 14, fontWeight: "bold" },
	removeButton: { paddingHorizontal: 12, paddingVertical: 6 },
	leaveButton: { padding: 12, alignItems: "center", marginBottom: 12 },
	leaveText: { color: "#fff", fontWeight: "bold" },
});
