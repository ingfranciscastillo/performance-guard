import { queryOptions } from "@tanstack/react-query";
import { listOrgTokens } from "@/lib/org-tokens.functions";

export const orgTokensQueryOptions = () =>
	queryOptions({
		queryKey: ["org-tokens"],
		queryFn: () => listOrgTokens(),
	});
