import { queryOptions } from "@tanstack/react-query";
import { getAlertRules } from "@/lib/alert-rules.functions";

export const alertRulesQueryOptions = () =>
	queryOptions({
		queryKey: ["alert-rules"],
		queryFn: () => getAlertRules(),
	});
