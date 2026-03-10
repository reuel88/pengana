import * as Network from "expo-network";
import { useEffect, useState } from "react";

export function useNetworkStatus() {
	const [isOnline, setIsOnline] = useState(true);
	const [simulateOffline, setSimulateOffline] = useState(false);

	useEffect(() => {
		Network.getNetworkStateAsync().then((state) => {
			setIsOnline(state.isConnected ?? true);
		});

		const subscription = Network.addNetworkStateListener((state) => {
			setIsOnline(state.isConnected ?? false);
		});

		return () => {
			subscription.remove();
		};
	}, []);

	return {
		isOnline: isOnline && !simulateOffline,
		simulateOffline,
		setSimulateOffline,
	};
}
