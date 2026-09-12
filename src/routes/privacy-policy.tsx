import { createFileRoute } from "@tanstack/react-router";
import { MarketingShell } from "@/components/marketing-shell";
import { Reveal } from "@/components/reveal";
import { OG_IMAGE_META, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/privacy-policy")({
	head: () => ({
		meta: [
			{ title: "Privacy Policy: Vitalgate" },
			{
				name: "description",
				content: "What Vitalgate collects, why, and how to reach us about it.",
			},
			{ property: "og:type", content: "website" },
			{ property: "og:url", content: `${SITE_URL}/privacy-policy` },
			{ property: "og:title", content: "Vitalgate privacy policy" },
			...OG_IMAGE_META,
			{ name: "twitter:card", content: "summary_large_image" },
		],
		links: [{ rel: "canonical", href: `${SITE_URL}/privacy-policy` }],
	}),
	component: PrivacyPolicy,
});

const EFFECTIVE_DATE = "September 11, 2026";

function PrivacyPolicy() {
	return (
		<MarketingShell>
			<article className="mx-auto max-w-2xl px-5 py-20">
				<Reveal>
					<span className="text-xs uppercase tracking-wider text-primary">
						Legal
					</span>
					<h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
						Privacy Policy
					</h1>
					<p className="mt-3 text-sm text-muted-foreground">
						Effective {EFFECTIVE_DATE}. This describes what Vitalgate ("we,"
						"us") actually collects when you use{" "}
						<span className="font-mono">vitalgate.vercel.app</span>, not a
						generic template — if we don't do something below, we don't do it.
					</p>
				</Reveal>

				<Reveal delay={0.05}>
					<div className="prose prose-sm prose-neutral dark:prose-invert mt-10 max-w-none space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-0 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_strong]:text-foreground">
						<section>
							<h2>1. What we collect</h2>
							<p>
								<strong>Account info.</strong> When you sign in with GitHub,
								Better Auth (our authentication library) stores your name,
								email, and avatar URL as given to us by GitHub — we never see
								your GitHub password.
							</p>
							<p>
								<strong>Organization and team data.</strong> Your workspace
								name, slug, and the list of members and their roles.
							</p>
							<p>
								<strong>Repository metadata.</strong> The repositories you
								connect (name, default branch, whether it's private) and the
								performance budgets you set for them. We never store your source
								code — see "Where your code runs" below.
							</p>
							<p>
								<strong>Performance data.</strong> The Lighthouse metrics (LCP,
								INP, CLS, and similar) your connected repos report per pull
								request, along with the PR's number, title, author, and branch
								name.
							</p>
							<p>
								<strong>Integration data.</strong> If you connect Slack or
								Discord, we store the webhook URL for your chosen channel,
								encrypted at rest. We don't read your Slack or Discord messages.
							</p>
							<p>
								<strong>Session data.</strong> To keep you signed in and detect
								suspicious activity, we store your session token, IP address,
								user-agent string, and sign-in timestamps. You can view and
								revoke these yourself from Settings → Security.
							</p>
							<p>
								<strong>Contact form submissions.</strong> If you use the
								contact form, we receive the name, email, and message you
								submit, relayed to us by email.
							</p>
						</section>

						<section>
							<h2>2. Where your code runs</h2>
							<p>
								Lighthouse audits run on <strong>your own</strong> GitHub
								Actions runner, using the workflow file Vitalgate commits to
								your repository. Your application never gets built, started, or
								executed on our infrastructure — only the resulting metrics
								(numbers, not code) are sent back to us over a signed request.
							</p>
						</section>

						<section>
							<h2>3. How we use it</h2>
							<p>
								To run the product: authenticate you, enforce your budgets, show
								your dashboard, and send the alerts you've enabled (by email,
								Slack, or Discord). To respond when you contact us. We don't use
								your data for advertising, and we don't run any analytics or
								ad-tracking scripts on this site.
							</p>
						</section>

						<section>
							<h2>4. Who we share it with</h2>
							<p>We don't sell your data. It's processed by:</p>
							<ul>
								<li>
									<strong>GitHub</strong> — for sign-in and to read/write the
									repos you connect.
								</li>
								<li>
									<strong>Neon</strong> — our Postgres database host, where the
									data above is stored.
								</li>
								<li>
									<strong>Vercel</strong> — hosts this application.
								</li>
								<li>
									<strong>Resend</strong> — delivers email alerts, the weekly
									digest, and contact form messages.
								</li>
								<li>
									<strong>Slack / Discord</strong> — only if you connect them,
									to deliver the alerts you configure.
								</li>
							</ul>
						</section>

						<section>
							<h2>5. How long we keep it</h2>
							<p>
								We keep your data while your account and organization are
								active. Disconnecting a repository deletes its budgets, pull
								request history, and alerts immediately. We don't yet have a
								self-service "delete my account" button — email us (below) and
								we'll delete your account and personal data by hand, usually
								within a few days.
							</p>
						</section>

						<section>
							<h2>6. Security</h2>
							<p>
								Traffic to this site is encrypted (HTTPS/HSTS). Slack/Discord
								webhook URLs are encrypted at rest (AES-256-GCM) rather than
								stored as plain text. Passwords, where you set one, are hashed,
								never stored in plain text.
							</p>
						</section>

						<section>
							<h2>7. Cookies</h2>
							<p>
								We use one cookie to keep you signed in. That's it — no
								advertising cookies, no third-party tracking pixels.
							</p>
						</section>

						<section>
							<h2>8. Your rights</h2>
							<p>
								You can review and revoke your own active sessions from Settings
								→ Security at any time. For anything else — access, correction,
								export, or deletion of your data — use the{" "}
								<a href="/#contact" className="text-primary hover:underline">
									contact form
								</a>
								. We'll respond within a reasonable time, generally within 30
								days.
							</p>
						</section>

						<section>
							<h2>9. Children</h2>
							<p>
								Vitalgate is a developer tool for teams and isn't directed at,
								or knowingly used by, children under 16.
							</p>
						</section>

						<section>
							<h2>10. Changes to this policy</h2>
							<p>
								If we materially change what we collect or how we use it, we'll
								update the effective date at the top of this page.
							</p>
						</section>

						<section>
							<h2>11. Contact</h2>
							<p>
								Questions about this policy or your data? Use the{" "}
								<a href="/#contact" className="text-primary hover:underline">
									contact form
								</a>{" "}
								on the homepage.
							</p>
						</section>
					</div>
				</Reveal>
			</article>
		</MarketingShell>
	);
}
