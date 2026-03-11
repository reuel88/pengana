import * as Network from "expo-network";
import { useEffect, useState } from "react";

export function useNetworkStatus() {
	const [isOnline, setIsOnline] = useState(false);
	const [simulateOffline, setSimulateOffline] = useState(false);

	useEffect(() => {
		Network.getNetworkStateAsync().then((state) => {
			setIsOnline(state.isInternetReachable ?? state.isConnected ?? false);
		});

		const subscription = Network.addNetworkStateListener((state) => {
			setIsOnline(state.isInternetReachable ?? state.isConnected ?? false);
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
