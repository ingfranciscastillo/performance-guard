import { queryOptions } from "@tanstack/react-query";
import { getConnectableRepos } from "@/lib/github.functions";

export const connectableReposQueryOptions = () =>
	queryOptions({
		queryKey: ["github", "connectable-repos"],
		queryFn: () => getConnectableRepos(),
		// The list comes from GitHub's API each time — stale quickly on purpose
		// so a repo pushed/renamed seconds ago still shows up on next visit.
		staleTime: 30_000,
	});
