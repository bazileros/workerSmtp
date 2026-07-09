import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@workerSmtp/ui/components/badge";
import { Button } from "@workerSmtp/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workerSmtp/ui/components/card";
import { Checkbox } from "@workerSmtp/ui/components/checkbox";
import { Empty, EmptyContent, EmptyDescription, EmptyTitle } from "@workerSmtp/ui/components/empty";
import { Input } from "@workerSmtp/ui/components/input";
import { Label } from "@workerSmtp/ui/components/label";
import { PasswordInput } from "@workerSmtp/ui/components/password-input";
import { RadioGroup, RadioGroupItem } from "@workerSmtp/ui/components/radio-group";
import { Separator } from "@workerSmtp/ui/components/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workerSmtp/ui/components/table";
import { CopyIcon, GlobeIcon, LockIcon, PencilIcon, PlusIcon, SendIcon, ServerIcon, TagIcon, TerminalIcon, Trash2Icon, UserIcon, ZapIcon } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";
import { toast } from "sonner";

import { env } from "@workerSmtp/env/web";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/_admin/profiles")({
  component: ProfilesPage,
});

function ProfilesPage() {
  const queryClient = useQueryClient();
  const profiles = useQuery(orpc["smtp-profile"].list.queryOptions());
  const createMutation = useMutation(orpc["smtp-profile"].create.mutationOptions());
  const updateMutation = useMutation(orpc["smtp-profile"].update.mutationOptions({
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: orpc["smtp-profile"].key() }); setEditProfile(null); toast.success("Profile updated"); },
  }));
  const deleteMutation = useMutation(orpc["smtp-profile"].delete.mutationOptions());

  const [label, setLabel] = useState("");
  const [host, setHost] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [encryption, setEncryption] = useState<"ssl" | "starttls">("starttls");
  const [isDefault, setIsDefault] = useState(false);
  const [editProfile, setEditProfile] = useState<{ id: string; label: string; host: string; port: number; username: string; authType: string; maxSendsPerMinute: number; isDefault: boolean; secure: boolean; startTls: boolean } | null>(null);
  const [testProfileId, setTestProfileId] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testPriority, setTestPriority] = useState<"transactional" | "bulk">("transactional");
  const [testResult, setTestResult] = useState<{ email: string; success: boolean; error?: string; status?: string }[] | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [authType, setAuthType] = useState("plain");
  const [maxSends, setMaxSends] = useState("60");

  function resetForm() {
    setLabel(""); setHost(""); setUsername(""); setPassword("");
    setEncryption("starttls"); setIsDefault(false); setAuthType("plain"); setMaxSends("60");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        label, host, port: encryption === "ssl" ? 465 : 587, username, password,
        secure: encryption === "ssl", startTls: encryption === "starttls",
        isDefault, authType: authType as "plain" | "login" | "cram-md5",
        maxSendsPerMinute: Number.parseInt(maxSends, 10),
      });
      toast.success("SMTP profile created");
      resetForm();
      queryClient.invalidateQueries({ queryKey: orpc["smtp-profile"].key() });
    } catch { toast.error("Failed to create profile"); }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("SMTP profile deleted");
      queryClient.invalidateQueries({ queryKey: orpc["smtp-profile"].key() });
    } catch { toast.error("Failed to delete profile"); }
  }

  const isPending = createMutation.isPending;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PlusIcon className="size-4 text-primary" />
            New SMTP Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="label" className="text-sm font-medium">Profile Label</Label>
                <div className="relative">
                  <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. SendGrid Relay" required className="h-10 pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="host" className="text-sm font-medium">SMTP Host</Label>
                <div className="relative">
                  <GlobeIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input id="host" value={host} onChange={(e) => setHost(e.target.value)} placeholder="e.g. smtp.sendgrid.net" required className="h-10 pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="apikey" required className="h-10 pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your SMTP password" required className="h-10 pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxSends" className="text-sm font-medium">Max Sends Per Minute</Label>
                <div className="relative">
                  <ZapIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input id="maxSends" type="number" value={maxSends} onChange={(e) => setMaxSends(e.target.value)} placeholder="60" className="h-10 pl-9" />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium">Encryption</Label>
              <RadioGroup value={encryption} onValueChange={(v) => setEncryption(v as "ssl" | "starttls")}>
                <RadioGroupItem value="ssl">SSL / TLS <span className="text-muted-foreground font-normal">(port 465)</span></RadioGroupItem>
                <RadioGroupItem value="starttls">STARTTLS <span className="text-muted-foreground font-normal">(port 587)</span></RadioGroupItem>
              </RadioGroup>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-active={isDefault || undefined}
                onClick={() => setIsDefault((p) => !p)}
                className="flex items-center gap-2 rounded-lg border border-input px-3 py-2 text-xs font-medium transition-all select-none hover:border-ring hover:bg-accent/50 data-[active]:border-primary data-[active]:bg-primary/10 data-[active]:text-primary"
              >
                <span className="flex size-3.5 items-center justify-center rounded-full border border-input data-[active]:border-primary data-[active]:bg-primary" data-active={isDefault || undefined}>
                  {isDefault && <span className="size-1.5 rounded-full bg-primary-foreground" />}
                </span>
                Default Profile
              </button>
            </div>

            <Separator />

            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Authentication Method</Label>
                <RadioGroup value={authType} onValueChange={(v) => setAuthType(v)}>
                  <RadioGroupItem value="plain" checked={authType === "plain"}>Plain</RadioGroupItem>
                  <RadioGroupItem value="login" checked={authType === "login"}>Login</RadioGroupItem>
                  <RadioGroupItem value="cram-md5" checked={authType === "cram-md5"}>CRAM-MD5</RadioGroupItem>
                </RadioGroup>
              </div>
              <Button type="submit" size="lg" disabled={isPending} className="min-w-[160px]">
                {isPending ? "Creating..." : "Create Profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">SMTP Profiles</CardTitle>
            <Button size="xs" variant="secondary" onClick={() => { setTestProfileId("__default__"); setTestEmail(""); setTestResult(null); }}>
              <SendIcon className="size-3" />
              Test Default
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {profiles.isPending ? (
            <div className="space-y-3 px-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : profiles.data?.profiles.length === 0 ? (
            <Empty>
              <EmptyContent>
                <ServerIcon className="size-8 text-muted-foreground" />
                <EmptyTitle>No SMTP profiles yet</EmptyTitle>
                <EmptyDescription>Add an SMTP relay to start sending emails.</EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Port</TableHead>
                  <TableHead>Auth</TableHead>
                  <TableHead>Rate Limit</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.data?.profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.label}</TableCell>
                    <TableCell className="font-mono text-[10px] text-muted-foreground max-w-[120px]">
                      <div className="flex items-center gap-1">
                        <span className="truncate">{p.id}</span>
                        <button
                          type="button"
                          onClick={() => { navigator.clipboard.writeText(p.id); toast.success("ID copied"); }}
                          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <CopyIcon className="size-3" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.host}</TableCell>
                    <TableCell className="tabular-nums">{p.port}</TableCell>
                    <TableCell>
                      <Badge>{p.authType}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs tabular-nums">
                      {p.maxSendsPerMinute}/min
                    </TableCell>
                    <TableCell>
                      {p.isDefault ? (
                        <Badge variant="success">Default</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="xs" variant="secondary" onClick={() => setEditProfile({ id: p.id, label: p.label ?? "", host: p.host, port: p.port ?? 587, username: p.username, authType: p.authType ?? "plain", maxSendsPerMinute: p.maxSendsPerMinute ?? 60, isDefault: !!p.isDefault, secure: !!p.secure, startTls: !!p.startTls })}>
                          <PencilIcon className="size-3" />
                          Edit
                        </Button>
                        <Button size="xs" variant="secondary" onClick={() => { setTestProfileId(p.id); setTestEmail(""); setTestResult(null); }}>
                          <SendIcon className="size-3" />
                        </Button>
                        <Button size="xs" variant="destructive" onClick={() => handleDelete(p.id)}>
                          <Trash2Icon className="size-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {editProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditProfile(null)}>
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-foreground mb-4">Edit Profile</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const data = new FormData(form);
              await updateMutation.mutateAsync({
                id: editProfile.id,
                label: data.get("label") as string,
                host: data.get("host") as string,
                port: Number(data.get("port")),
                username: data.get("username") as string,
                password: (data.get("password") as string) || undefined,
                authType: editProfile.authType as any,
                maxSendsPerMinute: Number(data.get("maxSends")),
                isDefault: data.get("isDefault") === "on",
                secure: editProfile.secure,
                startTls: editProfile.startTls,
              });
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Label</Label>
                  <Input name="label" defaultValue={editProfile.label} required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label>Host</Label>
                  <Input name="host" defaultValue={editProfile.host} required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label>Port</Label>
                  <Input name="port" type="number" defaultValue={editProfile.port} required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label>Username</Label>
                  <Input name="username" defaultValue={editProfile.username} required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label>New Password <span className="text-muted-foreground font-normal">(leave blank to keep)</span></Label>
                  <PasswordInput name="password" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label>Max Sends/Min</Label>
                  <Input name="maxSends" type="number" defaultValue={editProfile.maxSendsPerMinute} className="h-10" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox name="isDefault" defaultChecked={editProfile.isDefault} />
                <span className="text-sm">Default profile</span>
              </label>
              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditProfile(null)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {testProfileId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setTestProfileId(null)}>
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-foreground mb-1">Test SMTP Profile</h3>
            <p className="text-xs text-muted-foreground mb-4">Send a test email to verify this profile works, or copy the code snippet to use in your app.</p>

            <div className="space-y-4">
              <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
                {(["transactional", "bulk"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    data-active={testPriority === p || undefined}
                    onClick={() => setTestPriority(p)}
                    className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm text-muted-foreground hover:text-foreground capitalize"
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Recipient(s)</Label>
                <textarea
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="you@example.com"
                  rows={3}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 resize-none h-20"
                />
                <p className="text-[10px] text-muted-foreground">One email per line or comma-separated</p>
              </div>

              {Array.isArray(testResult) && (
                <div className="rounded-lg border border-border divide-y divide-border text-xs">
                  {testResult.map((r) => (
                    <div key={r.email} className="flex items-center justify-between px-3 py-2">
                      <span className="font-mono truncate max-w-[200px]">{r.email}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {r.success ? (
                          <span className="text-emerald-500 font-medium">Sent</span>
                        ) : (
                          <span className="text-red-500 font-medium" title={r.error}>Failed</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  disabled={!testEmail || testLoading}
                  onClick={async () => {
                    setTestLoading(true);
                    setTestResult(null);
                    try {
                      const serverUrl = (env.VITE_SERVER_URL || "http://localhost:3000").replace(/\/+$/, "");
                      const recipients = testEmail.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
                      const res = await fetch(`${serverUrl}/admin/test-profile`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ profileId: testProfileId, to: recipients, priority: testPriority }),
                      });
                      const data = await res.json();
                      setTestResult(data);
                    } catch {
                      setTestResult({ success: false, error: "Network error" });
                    }
                    setTestLoading(false);
                  }}
                >
                  {testLoading ? "Sending..." : "Send Test"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setTestProfileId(null)}>Close</Button>
              </div>

              <details className="text-xs">
                <summary className="flex items-center gap-1.5 cursor-pointer text-primary hover:text-primary/80 font-medium">
                  <TerminalIcon className="size-3.5" />
                  Node.js fetch example
                </summary>
                <div className="relative mt-2 group rounded-lg overflow-hidden border border-border">
                  <button
                    type="button"
                    onClick={() => {
                      const recipients = (testEmail || "recipient@example.com").split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
                      const snippet = `const response = await fetch("http://localhost:3000/rpc/email/send", {\n  method: "POST",\n  headers: {\n    "Authorization": "Bearer YOUR_API_KEY",\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({\n    json: {\n      smtpProfileId: "${testProfileId}",\n      to: ${JSON.stringify(recipients.length > 1 ? recipients : recipients[0])},\n      subject: "Hello from Mail Dispatch",\n      htmlBody: "<h1>Hello!</h1><p>Test email.</p>",\n      priority: "${testPriority}",\n    },\n  }),\n});\n\nconst data = await response.json();\nconsole.log(data);`;
                      navigator.clipboard.writeText(snippet);
                      toast.success("Copied");
                    }}
                    className="absolute top-2 right-2 z-10 flex size-7 items-center justify-center rounded-md bg-muted/80 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  >
                    <CopyIcon className="size-3" />
                  </button>
                  <SyntaxHighlighter
                    language="javascript"
                    style={oneDark}
                    customStyle={{ margin: 0, borderRadius: 0, fontSize: "11px", lineHeight: "1.5" }}
                    codeTagProps={{ style: { fontFamily: "inherit" } }}
                  >{(() => {
                    const recipients = (testEmail || "recipient@example.com").split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
                    return `const response = await fetch("http://localhost:3000/rpc/email/send", {\n  method: "POST",\n  headers: {\n    "Authorization": "Bearer YOUR_API_KEY",\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({\n    json: {\n      smtpProfileId: "${testProfileId}",\n      to: ${JSON.stringify(recipients.length > 1 ? recipients : recipients[0])},\n      subject: "Hello from Mail Dispatch",\n      htmlBody: "<h1>Hello!</h1><p>Test email.</p>",\n      priority: "${testPriority}",\n    },\n  }),\n});\n\nconst data = await response.json();\nconsole.log(data);`;
                  })()}</SyntaxHighlighter>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
