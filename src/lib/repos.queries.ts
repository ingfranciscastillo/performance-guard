import { queryOptions } from "@tanstack/react-query";
import { getOrgRepos } from "@/lib/repos.functions";

export const orgReposQueryOptions = () =>
	queryOptions({
		queryKey: ["repos"],
		queryFn: () => getOrgRepos(),
	});
