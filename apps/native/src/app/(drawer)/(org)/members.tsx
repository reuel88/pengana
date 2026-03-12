import { useTranslation } from "@pengana/i18n";
import { useMemberActions } from "@pengana/org-client";
import { useRouter } from "expo-router";
import {
	Alert,
	FlatList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useActiveOrg, useOrgRole } from "@/shared/hooks/use-org-queries";
import { authClient } from "@/shared/lib/auth-client";
import { useTheme } from "@/shared/lib/theme";
import { mutedText, secondaryText, sharedStyles } from "@/shared/styles/shared";
import { Container } from "@/shared/ui/container";
import { EmptyOrgScreen } from "@/shared/ui/empty-org-screen";
import { LoadingScreen } from "@/shared/ui/loading-screen";

function MemberRow({
	member,
	isAdmin,
	isCurrentUser,
	onRemove,
	t,
}: {
	member: {
		id: string;
		userId: string;
		role: string;
		user: { name: string; email: string };
	};
	isAdmin: boolean;
	isCurrentUser: boolean;
	onRemove: (memberId: string) => void;
	t: (key: string) => string;
}) {
	const { theme } = useTheme();

	return (
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
				<Text style={secondaryText(theme)}>{member.user.email}</Text>
				<Text style={[styles.roleText, { color: theme.primary }]}>
					{t(`roles.${member.role}`)}
				</Text>
			</View>
			{isAdmin && !isCurrentUser && member.role !== "owner" && (
				<TouchableOpacity
					onPress={() => onRemove(member.id)}
					style={[styles.removeButton, { backgroundColor: theme.notification }]}
				>
					<Text style={sharedStyles.smallButtonText}>
						{t("members.remove")}
					</Text>
				</TouchableOpacity>
			)}
		</View>
	);
}

export default function MembersScreen() {
	const { theme } = useTheme();
	const { t } = useTranslation("organization");
	const router = useRouter();
	const { data: activeOrg, isPending } = useActiveOrg();
	const { data: session } = authClient.useSession();
	const currentUserId = session?.user?.id;
	const { isAdmin } = useOrgRole();

	const { handleRemove, handleLeave } = useMemberActions({
		onRemoveSuccess: () => Alert.alert("", t("members.removeSuccess")),
		onLeaveSuccess: async () => {
			router.replace("/");
		},
		onError: (message) => Alert.alert("", message || t("members.error")),
		errorMessages: {
			remove: t("members.removeError"),
			leave: t("members.leaveError"),
		},
	});

	if (isPending) return <LoadingScreen />;
	if (!activeOrg) return <EmptyOrgScreen />;

	const members = activeOrg.members || [];

	const onRemove = (memberId: string) => {
		Alert.alert(t("members.remove"), t("members.removeConfirm"), [
			{ text: t("common:confirm.cancel"), style: "cancel" },
			{
				text: t("members.remove"),
				style: "destructive",
				onPress: () => handleRemove(memberId),
			},
		]);
	};

	const onLeave = () => {
		if (!currentUserId) return;
		const currentMember = members.find((m) => m.userId === currentUserId);
		if (!currentMember) return;
		Alert.alert(t("members.leave"), t("members.leaveConfirm"), [
			{ text: t("common:confirm.cancel"), style: "cancel" },
			{
				text: t("members.leave"),
				style: "destructive",
				onPress: () => handleLeave(currentMember.id),
			},
		]);
	};

	return (
		<Container>
			<FlatList
				data={members}
				keyExtractor={(item) => item.id}
				contentContainerStyle={sharedStyles.listContainer}
				ListHeaderComponent={
					<TouchableOpacity
						style={[
							styles.leaveButton,
							{ backgroundColor: theme.notification },
						]}
						onPress={onLeave}
					>
						<Text style={sharedStyles.buttonText}>{t("members.leave")}</Text>
					</TouchableOpacity>
				}
				ListEmptyComponent={
					<Text style={mutedText(theme)}>{t("members.noMembers")}</Text>
				}
				renderItem={({ item: member }) => (
					<MemberRow
						member={member}
						isAdmin={isAdmin}
						isCurrentUser={member.userId === currentUserId}
						onRemove={onRemove}
						t={t}
					/>
				)}
			/>
		</Container>
	);
}

const styles = StyleSheet.create({
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
	roleText: { fontSize: 12 },
});
