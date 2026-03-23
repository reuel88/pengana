import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
	OrganizationTodoContent,
	PersonalTodoContent,
	TodoShell,
	type TodoTab,
} from "./todo-content";

export function TodoPage({
	userId,
	organizationId,
}: {
	userId: string;
	organizationId: string;
}) {
	const [activeTab, setActiveTab] = useState<TodoTab>("personal");

	return (
		<View style={styles.page}>
			<ScrollView style={styles.scroll}>
				<TodoShell activeTab={activeTab} onTabChange={setActiveTab} />

				{activeTab === "personal" && (
					<View testID="personal-todo-panel">
						<PersonalTodoContent
							userId={userId}
							organizationId={organizationId}
						/>
					</View>
				)}

				{activeTab === "organization" && (
					<View testID="organization-todo-panel">
						<OrganizationTodoContent
							organizationId={organizationId}
							userId={userId}
						/>
					</View>
				)}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	page: {
		flex: 1,
	},
	scroll: {
		flex: 1,
	},
});
