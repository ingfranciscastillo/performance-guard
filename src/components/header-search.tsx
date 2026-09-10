import {
	FolderSimpleIcon,
	GitPullRequestIcon,
	MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Popover } from "radix-ui";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { orgPullsQueryOptions } from "@/lib/pulls.queries";
import { orgReposQueryOptions } from "@/lib/repos.queries";

const MAX_RESULTS_PER_GROUP = 5;

/** Jumps to a repo or PR by name/title/number — the only two entities this app has to search. */
export function HeaderSearch() {
	const [query, setQuery] = useState("");
	const [open, setOpen] = useState(false);
	const navigate = useNavigate();
	// Non-suspending: the header renders on every authenticated page, most of
	// which already warm these same caches (repos/pulls list pages), so this
	// is normally an instant cache hit rather than a fresh fetch.
	const { data: repos } = useQuery(orgReposQueryOptions());
	const { data: pulls } = useQuery(orgPullsQueryOptions());

	const q = query.trim().toLowerCase();

	const matchedRepos = useMemo(() => {
		if (!q) return [];
		return (repos ?? [])
			.filter((r) => r.fullName.toLowerCase().includes(q))
			.slice(0, MAX_RESULTS_PER_GROUP);
	}, [repos, q]);

	const matchedPulls = useMemo(() => {
		if (!q) return [];
		return (pulls ?? [])
			.filter(
				(p) =>
					p.title.toLowerCase().includes(q) ||
					p.repoFullName.toLowerCase().includes(q) ||
					String(p.number) === q,
			)
			.slice(0, MAX_RESULTS_PER_GROUP);
	}, [pulls, q]);

	const hasResults = matchedRepos.length > 0 || matchedPulls.length > 0;

	const close = () => {
		setOpen(false);
		setQuery("");
	};

	const handleEnter = () => {
		if (matchedRepos[0]) {
			navigate({
				to: "/repositories/$repoId",
				params: { repoId: matchedRepos[0].id },
			});
		} else if (matchedPulls[0]) {
			navigate({ to: "/pulls/$prId", params: { prId: matchedPulls[0].id } });
		} else {
			return;
		}
		close();
	};

	return (
		<Popover.Root open={open} onOpenChange={setOpen}>
			<Popover.Anchor asChild>
				<div className="relative hidden max-w-md flex-1 md:flex">
					<MagnifyingGlassIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search repos, pull requests…"
						value={query}
						onChange={(e) => {
							const next = e.target.value;
							setQuery(next);
							setOpen(next.trim().length > 0);
						}}
						onFocus={() => {
							if (q.length > 0) setOpen(true);
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleEnter();
							if (e.key === "Escape") setOpen(false);
						}}
						className="h-9 border-border bg-muted/40 pl-8"
					/>
				</div>
			</Popover.Anchor>
			<Popover.Portal>
				<Popover.Content
					align="start"
					sideOffset={6}
					onOpenAutoFocus={(e) => e.preventDefault()}
					className="z-50 w-[26rem] max-w-[90vw] overflow-hidden border border-border bg-popover text-popover-foreground shadow-md outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-150 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:duration-[200ms]"
				>
					{!hasResults ? (
						<p className="px-4 py-6 text-center text-sm text-muted-foreground">
							No results for "{query}"
						</p>
					) : (
						<div className="max-h-96 overflow-y-auto py-1.5">
							{matchedRepos.length > 0 && (
								<div>
									<div className="px-3 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
										Repositories
									</div>
									{matchedRepos.map((r) => (
										<Link
											key={r.id}
											to="/repositories/$repoId"
											params={{ repoId: r.id }}
											onClick={close}
											className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60"
										>
											<FolderSimpleIcon className="size-3.5 shrink-0 text-muted-foreground" />
											<span className="truncate font-mono">{r.fullName}</span>
										</Link>
									))}
								</div>
							)}
							{matchedPulls.length > 0 && (
								<div>
									<div className="px-3 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
										Pull requests
									</div>
									{matchedPulls.map((p) => (
										<Link
											key={p.id}
											to="/pulls/$prId"
											params={{ prId: p.id }}
											onClick={close}
											className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60"
										>
											<GitPullRequestIcon className="size-3.5 shrink-0 text-muted-foreground" />
											<span className="truncate">{p.title}</span>
											<span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">
												#{p.number}
											</span>
										</Link>
									))}
								</div>
							)}
						</div>
					)}
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
