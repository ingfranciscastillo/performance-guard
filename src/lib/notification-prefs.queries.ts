import { queryOptions } from "@tanstack/react-query";
import { getNotificationPrefs } from "@/lib/notification-prefs.functions";

export const notificationPrefsQueryOptions = () =>
	queryOptions({
		queryKey: ["notification-prefs"],
		queryFn: () => getNotificationPrefs(),
	});
