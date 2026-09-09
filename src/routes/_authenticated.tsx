import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/auth.functions";
import { NOINDEX_META } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async () => {
		const session = await getSession();
		if (!session) {
			throw redirect({ to: "/login" });
		}
		return { session };
	},
	// Every page under here is private, per-org data — TanStack Router merges
	// this into every child route's own head(), so one noindex here covers
	// all of them instead of repeating it 9 times. Defense in depth: the
	// beforeLoad redirect above already keeps a crawler with no session from
	// ever seeing the real content.
	head: () => ({ meta: NOINDEX_META }),
	component: () => <Outlet />,
});
