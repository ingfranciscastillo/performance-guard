import { queryOptions } from "@tanstack/react-query";
import { getRepoDetail } from "@/lib/repo-detail.functions";

export const repoDetailQueryOptions = (repoId: string) =>
	queryOptions({
		queryKey: ["repos", repoId],
		queryFn: () => getRepoDetail({ data: repoId }),
	});
