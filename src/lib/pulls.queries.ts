import { queryOptions } from "@tanstack/react-query";
import { getOrgPulls, getPullDetail } from "@/lib/pulls.functions";

export const orgPullsQueryOptions = () =>
	queryOptions({
		queryKey: ["pulls"],
		queryFn: () => getOrgPulls(),
	});

export const pullDetailQueryOptions = (prId: string) =>
	queryOptions({
		queryKey: ["pulls", prId],
		queryFn: () => getPullDetail({ data: prId }),
	});
