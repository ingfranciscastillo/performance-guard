import { createFileRoute } from "@tanstack/react-router";
import { handleIntegrationCallback } from "@/lib/integration-callback.server";
import { exchangeDiscordCode } from "@/lib/integrations.server";

export const Route = createFileRoute("/api/integrations/discord/callback")({
	server: {
		handlers: {
			GET: ({ request }) =>
				handleIntegrationCallback(request, "discord", exchangeDiscordCode),
		},
	},
});
