import { createFileRoute } from "@tanstack/react-router";
import { handleIntegrationCallback } from "@/lib/integration-callback.server";
import { exchangeSlackCode } from "@/lib/integrations.server";

export const Route = createFileRoute("/api/integrations/slack/callback")({
	server: {
		handlers: {
			GET: ({ request }) =>
				handleIntegrationCallback(request, "slack", exchangeSlackCode),
		},
	},
});
