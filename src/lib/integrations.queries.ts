import { queryOptions } from "@tanstack/react-query";
import { getIntegrationsOverview } from "@/lib/integrations.functions";

export const integrationsOverviewQueryOptions = () =>
	queryOptions({
		queryKey: ["integrations-overview"],
		queryFn: () => getIntegrationsOverview(),
	});
