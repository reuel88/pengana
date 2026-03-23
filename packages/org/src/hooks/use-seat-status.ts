import { useQuery } from "@tanstack/react-query";

export type SeatStatus = {
	isSeated: boolean;
	seatedCount: number;
	seatLimit: number;
};

export function useSeatStatus(
	orgId: string | undefined,
	fetcher: (orgId: string) => Promise<SeatStatus>,
) {
	return useQuery({
		queryKey: ["seat-status", orgId],
		queryFn: () => {
			if (!orgId) throw new Error("orgId is required");
			return fetcher(orgId);
		},
		enabled: !!orgId,
		staleTime: 30_000,
	});
}
