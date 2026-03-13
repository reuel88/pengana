import FontAwesome from "@expo/vector-icons/FontAwesome";
import { forwardRef } from "react";
import { Pressable, StyleSheet, type View } from "react-native";

import { useTheme } from "@/shared/lib/theme";

export const HeaderButton = forwardRef<View, { onPress?: () => void }>(
	({ onPress }, ref) => {
		const { theme } = useTheme();

		return (
			<Pressable
				ref={ref}
				onPress={onPress}
				accessibilityRole="button"
				accessibilityLabel="Open modal"
				hitSlop={8}
				style={({ pressed }) => [
					styles.button,
					{
						backgroundColor: pressed ? theme.background : theme.card,
					},
				]}
			>
				{({ pressed }) => (
					<FontAwesome
						name="info-circle"
						size={20}
						color={theme.text}
						style={{
							opacity: pressed ? 0.7 : 1,
						}}
					/>
				)}
			</Pressable>
		);
	},
);

HeaderButton.displayName = "HeaderButton";

const styles = StyleSheet.create({
	button: {
		padding: 8,
		marginRight: 8,
	},
});
