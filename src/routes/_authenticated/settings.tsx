import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { GithubLogo, DiscordLogo, SlackLogo, EnvelopeSimple } from "@phosphor-icons/react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings: Budgetly" }] }),
  component: Settings,
});

function Settings() {
  return (
    <AppShell title="Settings">
      <Tabs defaultValue="org">
        <TabsList>
          <TabsTrigger value="org">Organization</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="org" className="mt-6 space-y-4">
          <Card className="p-6 max-w-xl">
            <h2 className="font-semibold">Organization</h2>
            <div className="mt-4 grid gap-4">
              <div>
                <Label htmlFor="orgname">Workspace name</Label>
                <Input id="orgname" defaultValue="Acme Inc." className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" defaultValue="acme" className="mt-1.5 font-mono" />
              </div>
              <div className="pt-2"><Button>Save changes</Button></div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6 grid sm:grid-cols-2 gap-4 max-w-3xl">
          {[
            { name: "GitHub", desc: "Connected as acme org, 4 repos", icon: GithubLogo, connected: true },
            { name: "Slack", desc: "#perf-alerts, 12 routes", icon: SlackLogo, connected: true },
            { name: "Discord", desc: "Not connected", icon: DiscordLogo, connected: false },
            { name: "Email digest", desc: "Weekly to engineering@acme.dev", icon: EnvelopeSimple, connected: true },
          ].map((i) => (
            <Card key={i.name} className="p-5">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-md bg-muted grid place-items-center"><i.icon className="h-4 w-4" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2"><span className="font-medium">{i.name}</span>{i.connected && <span className="rounded-full bg-success/15 text-success px-2 py-0.5 text-[10px]">Connected</span>}</div>
                  <p className="text-xs text-muted-foreground mt-1">{i.desc}</p>
                </div>
              </div>
              <div className="mt-4"><Button variant={i.connected ? "outline" : "default"} size="sm">{i.connected ? "Manage" : "Connect"}</Button></div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <Card className="p-6 max-w-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Current plan</h2>
                <p className="text-sm text-muted-foreground">Team, billed monthly</p>
              </div>
              <span className="font-mono text-2xl font-semibold">$149<span className="text-muted-foreground text-sm">/mo</span></span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div><div className="text-xs text-muted-foreground">Renews</div><div className="font-mono mt-1">Jul 12, 2026</div></div>
              <div><div className="text-xs text-muted-foreground">Seats used</div><div className="font-mono mt-1">5 / unlimited</div></div>
              <div><div className="text-xs text-muted-foreground">Repos monitored</div><div className="font-mono mt-1">4</div></div>
              <div><div className="text-xs text-muted-foreground">Lighthouse runs (mo)</div><div className="font-mono mt-1">12,403</div></div>
            </div>
            <div className="mt-6 flex gap-2"><Button variant="outline">Manage plan</Button><Button variant="ghost">Download invoice</Button></div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card className="p-6 max-w-xl">
            <h2 className="font-semibold">Notification preferences</h2>
            <ul className="mt-4 divide-y divide-border">
              {["Email me on critical alerts", "Email me on warnings", "Daily PR digest", "Weekly performance summary"].map((label, i) => (
                <li key={label} className="flex items-center justify-between py-3">
                  <span className="text-sm">{label}</span>
                  <Switch defaultChecked={i < 2} />
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
