import { queryOptions } from "@tanstack/react-query";
import { getOrgAlerts } from "@/lib/alerts.functions";

export const orgAlertsQueryOptions = () =>
	queryOptions({
		queryKey: ["alerts"],
		queryFn: () => getOrgAlerts(),
	});
