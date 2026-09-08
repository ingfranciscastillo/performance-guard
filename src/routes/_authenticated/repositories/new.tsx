import {
	ArrowLeftIcon,
	BuildingsIcon,
	CaretRightIcon,
	CheckIcon,
	GitBranchIcon,
	GithubLogoIcon,
	LockIcon,
	MagnifyingGlassIcon,
	ShieldCheckIcon,
	StarIcon,
} from "@phosphor-icons/react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/repositories/new")({
	head: () => ({
		meta: [
			{ title: "Connect a repository: Budgetly" },
			{
				name: "description",
				content:
					"Connect a GitHub repository to Budgetly to start enforcing performance budgets on every PR.",
			},
		],
	}),
	component: ConnectRepo,
});

type GhRepo = {
	id: string;
	name: string;
	fullName: string;
	defaultBranch: string;
	private: boolean;
	stars: number;
	language: string;
	updated: string;
	org: string;
};

const AVAILABLE: GhRepo[] = [
	{
		id: "1",
		name: "marketing",
		fullName: "acme/marketing",
		defaultBranch: "main",
		private: false,
		stars: 142,
		language: "TypeScript",
		updated: "2h ago",
		org: "acme",
	},
	{
		id: "2",
		name: "checkout",
		fullName: "acme/checkout",
		defaultBranch: "main",
		private: true,
		stars: 0,
		language: "TypeScript",
		updated: "1d ago",
		org: "acme",
	},
	{
		id: "3",
		name: "design-system",
		fullName: "acme/design-system",
		defaultBranch: "main",
		private: false,
		stars: 318,
		language: "TypeScript",
		updated: "5h ago",
		org: "acme",
	},
	{
		id: "4",
		name: "mobile-web",
		fullName: "acme/mobile-web",
		defaultBranch: "develop",
		private: true,
		stars: 0,
		language: "JavaScript",
		updated: "3d ago",
		org: "acme",
	},
	{
		id: "5",
		name: "blog",
		fullName: "acme-labs/blog",
		defaultBranch: "main",
		private: false,
		stars: 24,
		language: "MDX",
		updated: "12h ago",
		org: "acme-labs",
	},
	{
		id: "6",
		name: "playground",
		fullName: "acme-labs/playground",
		defaultBranch: "main",
		private: false,
		stars: 9,
		language: "TypeScript",
		updated: "4d ago",
		org: "acme-labs",
	},
	{
		id: "7",
		name: "perf-experiments",
		fullName: "acme-labs/perf-experiments",
		defaultBranch: "main",
		private: true,
		stars: 0,
		language: "TypeScript",
		updated: "6h ago",
		org: "acme-labs",
	},
];

const PRESETS = [
	{
		id: "default",
		label: "Default (Core Web Vitals)",
		desc: "LCP 2.5s · INP 200ms · CLS 0.1 · Score ≥ 90",
		recommended: true,
	},
	{
		id: "strict",
		label: "Strict",
		desc: "LCP 2.0s · INP 150ms · CLS 0.05 · Score ≥ 95",
	},
	{
		id: "relaxed",
		label: "Relaxed",
		desc: "LCP 3.5s · INP 300ms · CLS 0.15 · Score ≥ 75",
	},
	{
		id: "custom",
		label: "Custom",
		desc: "Configure budgets manually after connecting",
	},
];

function ConnectRepo() {
	const navigate = useNavigate();
	const [query, setQuery] = useState("");
	const [org, setOrg] = useState<string>("all");
	const [selected, setSelected] = useState<string[]>([]);
	const [preset, setPreset] = useState("default");
	const [branchProtect, setBranchProtect] = useState(true);
	const [postComments, setPostComments] = useState(true);

	const orgs = useMemo(
		() => Array.from(new Set(AVAILABLE.map((r) => r.org))),
		[],
	);
	const filtered = useMemo(
		() =>
			AVAILABLE.filter(
				(r) =>
					(org === "all" || r.org === org) &&
					(query.trim() === "" ||
						r.fullName.toLowerCase().includes(query.toLowerCase())),
			),
		[query, org],
	);

	const toggle = (id: string) =>
		setSelected((s) =>
			s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
		);
	const allFilteredSelected =
		filtered.length > 0 && filtered.every((r) => selected.includes(r.id));

	const onConnect = () => {
		if (selected.length === 0) {
			toast.error("Select at least one repository");
			return;
		}
		toast.success(
			`Connected ${selected.length} ${selected.length === 1 ? "repository" : "repositories"}`,
		);
		navigate({ to: "/repositories" });
	};

	return (
		<AppShell title="Connect a repository">
			<div className="mb-6">
				<Link
					to="/repositories"
					className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
				>
					<ArrowLeftIcon className="h-3.5 w-3.5" /> Back to repositories
				</Link>
				<div className="mt-3 flex flex-wrap items-end justify-between gap-3">
					<div>
						<h1 className="text-2xl font-semibold tracking-tight">
							Connect a repository
						</h1>
						<p className="text-sm text-muted-foreground mt-1">
							Pick one or more repositories. Budgetly will install the GitHub
							App, fetch the baseline, and start auditing every PR.
						</p>
					</div>
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<ShieldCheckIcon className="h-4 w-4 text-primary" /> Minimum-scope
						GitHub App
					</div>
				</div>
			</div>

			<Tabs defaultValue="github" className="">
				<TabsList>
					<TabsTrigger value="github">
						<GithubLogoIcon className="h-3.5 w-3.5 mr-1.5" /> From GitHub
					</TabsTrigger>
					<TabsTrigger value="url">From URL</TabsTrigger>
				</TabsList>

				<TabsContent value="github" className="mt-6">
					<div className="grid lg:grid-cols-[1fr_360px] gap-6">
						<div className="space-y-4">
							<Card className="p-4">
								<div className="flex flex-wrap items-center gap-2">
									<Select value={org} onValueChange={setOrg}>
										<SelectTrigger className="w-50">
											<BuildingsIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
											<SelectValue placeholder="All organizations" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All organizations</SelectItem>
											{orgs.map((o) => (
												<SelectItem key={o} value={o}>
													{o}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<div className="relative flex-1 min-w-55">
										<MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
										<Input
											placeholder="Search repositories"
											value={query}
											onChange={(e) => setQuery(e.target.value)}
											className="pl-8"
										/>
									</div>
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											if (allFilteredSelected) {
												setSelected((s) =>
													s.filter((id) => !filtered.some((r) => r.id === id)),
												);
											} else {
												setSelected((s) =>
													Array.from(
														new Set([...s, ...filtered.map((r) => r.id)]),
													),
												);
											}
										}}
									>
										{allFilteredSelected ? "Clear" : "Select all"}
									</Button>
								</div>
							</Card>

							<Card className="p-0 overflow-hidden">
								<ul className="divide-y divide-border">
									{filtered.length === 0 && (
										<li className="px-5 py-10 text-center text-sm text-muted-foreground">
											No repositories match "{query}".
										</li>
									)}
									{filtered.map((r) => {
										const checked = selected.includes(r.id);
										return (
											<li key={r.id}>
												{/*
												 * biome-ignore lint/a11y/noStaticElementInteractions: mouse-only row convenience
												 * biome-ignore lint/a11y/useKeyWithClickEvents: the Checkbox below is independently focusable and keyboard-operable
												 */}
												<div
													className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors ${
														checked ? "bg-primary/5" : "hover:bg-muted/30"
													}`}
													onClick={() => toggle(r.id)}
												>
													<Checkbox
														checked={checked}
														onCheckedChange={() => toggle(r.id)}
														onClick={(e) => e.stopPropagation()}
													/>
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-2">
															<span className="font-medium font-mono text-sm truncate">
																{r.fullName}
															</span>
															{r.private ? (
																<span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
																	<LockIcon className="h-2.5 w-2.5" /> private
																</span>
															) : (
																<span className="rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-[10px]">
																	public
																</span>
															)}
														</div>
														<div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
															<span className="inline-flex items-center gap-1">
																<GitBranchIcon className="h-3 w-3" />{" "}
																{r.defaultBranch}
															</span>
															<span>{r.language}</span>
															{r.stars > 0 && (
																<span className="inline-flex items-center gap-1">
																	<StarIcon className="h-3 w-3" /> {r.stars}
																</span>
															)}
															<span>updated {r.updated}</span>
														</div>
													</div>
													{checked && (
														<CheckIcon className="h-4 w-4 text-primary" />
													)}
												</div>
											</li>
										);
									})}
								</ul>
							</Card>

							<div className="text-xs text-muted-foreground">
								Don't see a repository?{" "}
								<a href="#permissions" className="text-primary hover:underline">
									Adjust GitHub App permissions
								</a>
								.
							</div>
						</div>

						<aside className="space-y-4">
							<Card className="p-5">
								<h2 className="font-semibold text-sm">Budget preset</h2>
								<p className="mt-1 text-xs text-muted-foreground">
									Applied to every selected repo. You can edit per-repo later.
								</p>
								<div className="mt-4 space-y-2">
									{PRESETS.map((p) => (
										<label
											key={p.id}
											className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
												preset === p.id
													? "border-primary bg-primary/5"
													: "border-border hover:bg-muted/30"
											}`}
										>
											<input
												type="radio"
												name="preset"
												className="mt-1 accent-(--color-primary)"
												checked={preset === p.id}
												onChange={() => setPreset(p.id)}
											/>
											<div className="flex-1">
												<div className="flex items-center gap-2">
													<span className="text-sm font-medium">{p.label}</span>
													{p.recommended && (
														<span className="rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-[10px]">
															recommended
														</span>
													)}
												</div>
												<div className="mt-0.5 text-[11px] text-muted-foreground font-mono">
													{p.desc}
												</div>
											</div>
										</label>
									))}
								</div>
							</Card>

							<Card className="p-5">
								<h2 className="font-semibold text-sm">Options</h2>
								<div className="mt-4 space-y-3">
									<div className="flex items-start gap-3">
										<Checkbox
											id="bp"
											checked={branchProtect}
											onCheckedChange={(v) => setBranchProtect(Boolean(v))}
										/>
										<div>
											<Label htmlFor="bp" className="text-sm">
												Block merges on fail
											</Label>
											<p className="text-xs text-muted-foreground">
												Required status check on the default branch.
											</p>
										</div>
									</div>
									<div className="flex items-start gap-3">
										<Checkbox
											id="cm"
											checked={postComments}
											onCheckedChange={(v) => setPostComments(Boolean(v))}
										/>
										<div>
											<Label htmlFor="cm" className="text-sm">
												Post PR comments
											</Label>
											<p className="text-xs text-muted-foreground">
												Inline metric diffs vs baseline.
											</p>
										</div>
									</div>
								</div>
							</Card>

							<Card className="p-5 bg-muted/30">
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">Selected</span>
									<span className="font-mono font-semibold">
										{selected.length}
									</span>
								</div>
								<Button className="mt-4 w-full" onClick={onConnect}>
									Connect {selected.length > 0 ? `${selected.length} ` : ""}
									repositor{selected.length === 1 ? "y" : "ies"}{" "}
									<CaretRightIcon className="h-4 w-4 ml-1" />
								</Button>
								<Link to="/repositories" className="mt-2 block">
									<Button variant="ghost" className="w-full">
										Cancel
									</Button>
								</Link>
							</Card>
						</aside>
					</div>
				</TabsContent>

				<TabsContent value="url" className="mt-6">
					<Card className="p-6 max-w-xl">
						<h2 className="font-semibold">Connect by URL</h2>
						<p className="text-sm text-muted-foreground mt-1">
							Paste a public GitHub repository URL. Budgetly will request
							read-only access.
						</p>
						<div className="mt-5 space-y-2">
							<Label htmlFor="url">Repository URL</Label>
							<Input
								id="url"
								placeholder="https://github.com/acme/storefront"
							/>
						</div>
						<div className="mt-5 flex justify-end gap-2">
							<Link to="/repositories">
								<Button variant="outline">Cancel</Button>
							</Link>
							<Button
								onClick={() => {
									toast.success("Repository connected");
									navigate({ to: "/repositories" });
								}}
							>
								Connect
							</Button>
						</div>
					</Card>
				</TabsContent>
			</Tabs>
		</AppShell>
	);
}
