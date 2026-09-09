import { queryOptions } from "@tanstack/react-query";
import { getDashboardOverview } from "@/lib/dashboard.functions";

export const dashboardOverviewQueryOptions = () =>
	queryOptions({
		queryKey: ["dashboard-overview"],
		queryFn: () => getDashboardOverview(),
	});
