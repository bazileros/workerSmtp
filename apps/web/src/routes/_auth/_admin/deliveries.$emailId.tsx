import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@workerSmtp/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workerSmtp/ui/components/card";
import { ArrowLeftIcon, ChevronDownIcon } from "lucide-react";
import { useState } from "react";

import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/_admin/deliveries/$emailId")({
  component: EmailDetailPage,
});

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-1 sm:col-span-2 space-y-1" : "space-y-1"}>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function EmailDetailPage() {
  const { emailId } = Route.useParams();
  const { data: email, isPending, error } = useQuery(orpc.email.get.queryOptions({ input: { id: emailId } }));
  const [showRaw, setShowRaw] = useState(false);

  if (isPending) {
    return <div className="text-sm text-muted-foreground p-4">Loading...</div>;
  }

  if (error || !email) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        Email not found.{' '}
        <Link to="/deliveries" className="text-primary hover:underline">Back to deliveries</Link>
      </div>
    );
  }

  const s: Record<string, { label: string; variant: "success" | "error" | "warning" | "queued" | "info" | "default" }> = {
    sent: { label: "Sent", variant: "success" },
    failed: { label: "Failed", variant: "error" },
    queued: { label: "Queued", variant: "queued" },
    sending: { label: "Sending", variant: "warning" },
    bounced: { label: "Bounced", variant: "error" },
  };

  const statusDef = s[email.status ?? ""] ?? { label: email.status ?? "Unknown", variant: "default" as const };

  return (
    <div className="space-y-4">
      <Link to="/deliveries" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeftIcon className="size-3.5" /> Back to deliveries
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Badge variant={statusDef.variant}>{statusDef.label}</Badge>
            <span className="font-mono text-[10px] text-muted-foreground font-normal truncate">{email.id}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">
          {/* Envelope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="From">{email.from}</Field>
            <Field label="To">{email.to}</Field>
            <Field label="Subject" full>{email.subject}</Field>
            <Field label="Reply-To">{email.replyTo || <span className="text-muted-foreground">—</span>}</Field>
            <Field label="CC">{email.cc || <span className="text-muted-foreground">—</span>}</Field>
            <Field label="BCC">{email.bcc || <span className="text-muted-foreground">—</span>}</Field>
          </div>

          <hr className="border-border" />

          {/* Delivery info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Priority">
              <Badge variant={email.priority === "transactional" ? "info" : "default"}>{email.priority}</Badge>
            </Field>
            <Field label="Status">
              <Badge variant={statusDef.variant}>{statusDef.label}</Badge>
            </Field>
            <Field label="Attempts"><span className="tabular-nums">{email.attempts}/{email.maxAttempts}</span></Field>
            <Field label="Profile ID"><code className="text-[11px] font-mono break-all">{email.smtpProfileId}</code></Field>
            <Field label="Created">{email.createdAt ? new Date(email.createdAt).toLocaleString() : "-"}</Field>
            <Field label="Sent At">{email.sentAt ? new Date(email.sentAt).toLocaleString() : <span className="text-muted-foreground">—</span>}</Field>
            <Field label="Scheduled">{email.scheduledAt ? new Date(email.scheduledAt).toLocaleString() : <span className="text-muted-foreground">—</span>}</Field>
            <Field label="API Key ID">{email.apiKeyId ? <span className="font-mono text-[11px]">{email.apiKeyId.slice(0, 8)}...{email.apiKeyId.slice(-4)}</span> : <span className="text-muted-foreground">—</span>}</Field>
          </div>

          {email.lastError && (
            <>
              <hr className="border-border" />
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-red-500 uppercase tracking-widest">Error</p>
                <pre className="rounded-lg bg-red-500/5 border border-red-500/20 p-3 text-xs overflow-x-auto whitespace-pre-wrap text-red-400">{email.lastError}</pre>
              </div>
            </>
          )}

          {/* Custom headers */}
          {email.headers && (
            <>
              <hr className="border-border" />
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Custom Headers</p>
                <pre className="rounded-lg bg-muted p-3 text-xs font-mono overflow-x-auto">{JSON.stringify(email.headers, null, 2)}</pre>
              </div>
            </>
          )}

          {/* Payload */}
          <hr className="border-border" />
          <div>
            <button
              type="button"
              onClick={() => setShowRaw(!showRaw)}
              className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
            >
              <ChevronDownIcon className={`size-3 transition-transform ${showRaw ? "rotate-0" : "-rotate-90"}`} />
              Raw Payload
            </button>
            {showRaw && (
              <pre className="mt-2 rounded-lg bg-card border border-border p-3 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap text-foreground/80">
                {JSON.stringify({ id: email.id, from: email.from, to: email.to, subject: email.subject, htmlBody: email.htmlBody, textBody: email.textBody, headers: email.headers, priority: email.priority, status: email.status, attempts: email.attempts, maxAttempts: email.maxAttempts, lastError: email.lastError, smtpProfileId: email.smtpProfileId, createdAt: email.createdAt, sentAt: email.sentAt, scheduledAt: email.scheduledAt, apiKeyId: email.apiKeyId ? `${email.apiKeyId.slice(0, 8)}...${email.apiKeyId.slice(-4)}` : null }, null, 2)}
              </pre>
            )}
          </div>

          {/* HTML Body preview */}
          {email.htmlBody && (
            <>
              <hr className="border-border" />
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">HTML Body</p>
                <div className="rounded-lg border border-input bg-white overflow-hidden max-h-[400px]">
                  <iframe
                    title="Email body preview"
                    className="w-full min-h-[200px]"
                    srcDoc={`<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"><\/script><style>body{margin:0;padding:16px;font-family:system-ui,sans-serif;background:#f5f5f5}*{box-sizing:border-box}<\/style></head><body>${email.htmlBody}</body></html>`}
                    sandbox="allow-scripts"
                  />
                </div>
              </div>
            </>
          )}

          {email.textBody && (
            <>
              <hr className="border-border" />
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Text Body</p>
                <pre className="rounded-lg bg-muted p-3 text-xs overflow-x-auto whitespace-pre-wrap">{email.textBody}</pre>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
