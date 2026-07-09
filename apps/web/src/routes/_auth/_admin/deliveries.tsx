import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet, useMatchRoute, useNavigate } from "@tanstack/react-router";
import { Badge } from "@workerSmtp/ui/components/badge";
import { Button } from "@workerSmtp/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workerSmtp/ui/components/card";
import { Empty, EmptyContent, EmptyDescription, EmptyTitle } from "@workerSmtp/ui/components/empty";
import { Label } from "@workerSmtp/ui/components/label";
import { Select, SelectItem, SelectPopup, SelectTrigger } from "@workerSmtp/ui/components/select";
import { Skeleton } from "@workerSmtp/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workerSmtp/ui/components/table";
import { AlertCircleIcon, CheckCircleIcon, ClockIcon, InboxIcon, RefreshCwIcon, SendIcon, TrendingUpIcon } from "lucide-react";
import { z } from "zod";

import { orpc } from "@/utils/orpc";

const searchSchema = z.object({
  status: z.enum(["queued", "sending", "sent", "failed", "bounced"]).optional(),
  priority: z.enum(["transactional", "bulk"]).optional(),
});

export const Route = createFileRoute("/_auth/_admin/deliveries")({
  validateSearch: (search: Record<string, unknown>) => searchSchema.parse(search),
  component: DeliveriesPage,
});

const STATUS_MAP: Record<string, { label: string; variant: "success" | "error" | "warning" | "queued" | "info" | "default" }> = {
  sent: { label: "Sent", variant: "success" },
  failed: { label: "Failed", variant: "error" },
  queued: { label: "Queued", variant: "queued" },
  sending: { label: "Sending", variant: "warning" },
  bounced: { label: "Bounced", variant: "error" },
};

function StatusBadge({ status }: { status: string | null }) {
  const s = STATUS_MAP[status ?? ""] ?? { label: status ?? "Unknown", variant: "default" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

function DonutChart({ segments, size = 120 }: { segments: { value: number; color: string; label: string }[]; size?: number }) {
  const total = segments.reduce((a, b) => a + b.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const sw = size * 0.12;
  const circ = 2 * Math.PI * r;

  let offset = 0;
  const arcs = segments.map((s) => {
    const pct = s.value / total;
    const dash = pct * circ;
    const rot = -90 + (offset / total) * 360;
    offset += s.value;
    return { ...s, pct, dash, rot };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="oklch(1 0 0 / 0.06)" strokeWidth={sw} />
      {arcs.map((a) =>
        a.pct > 0 ? (
          <circle key={a.label} cx={cx} cy={cy} r={r} fill="none" stroke={a.color} strokeWidth={sw}
            strokeDasharray={`${Math.max(a.dash, 1)} ${circ}`}
            strokeDashoffset={0}
            transform={`rotate(${a.rot} ${cx} ${cy})`}
            strokeLinecap="round"
          />
        ) : null
      )}
      <circle cx={cx} cy={cy} r={r * 0.6} fill="var(--background)" />
      <text x={cx} y={cy - 3} textAnchor="middle" className="fill-foreground text-xs font-bold font-heading" dominantBaseline="auto">{total}</text>
      <text x={cx} y={cy + 9} textAnchor="middle" className="fill-muted-foreground text-[7px]" dominantBaseline="auto">total</text>
    </svg>
  );
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const w = 120;
  const h = 32;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70" />
    </svg>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, chart }: { label: string; value: string; sub?: string; icon: React.ElementType; color: string; chart?: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-card p-5 space-y-3 animate-fade-up shadow-diffuse transition-all duration-500 hover:shadow-ambient">
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">{label}</p>
          <p className="text-2xl font-bold font-heading tracking-tight" style={{ color }}>{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground/60">{sub}</p>}
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}15` }}>
          <Icon className="size-4" style={{ color }} />
        </div>
      </div>
      {chart}
    </div>
  );
}

function DeliveriesPage() {
  const navigate = useNavigate();
  const { status, priority } = Route.useSearch();
  const queryClient = useQueryClient();
  const goDetail = (id: string) => navigate({ to: "/deliveries/$emailId", params: { emailId: id } });
  const emailList = useQuery({
    ...orpc.email.list.queryOptions({ input: { limit: 100, offset: 0, status, priority } }),
    refetchInterval: (query: any) => {
      const data = query.state.data;
      if (!data) return 3000;
      const hasActive = data.emails.some((e: any) => e.status === "queued" || e.status === "sending");
      return hasActive ? 3000 : 10000;
    },
  });
  const retryMutation = useMutation({
    ...orpc.email.retry.mutationOptions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.email.key() }),
  });

  const matchRoute = useMatchRoute();
  const isDetail = matchRoute({ to: "/deliveries/$emailId" });
  if (isDetail) return <Outlet />;

  if (emailList.isPending) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-card p-5"><Skeleton className="h-3 w-16 mb-4" /><Skeleton className="h-7 w-20" /></div>
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-[calc(1.5rem)]" />
      </div>
    );
  }

  const data = emailList.data;
  const total = data?.total ?? 0;
  const sentC = data?.emails.filter((e) => e.status === "sent").length ?? 0;
  const failedC = data?.emails.filter((e) => e.status === "failed" || e.status === "bounced").length ?? 0;
  const sendingOnly = data?.emails.filter((e) => e.status === "sending").length ?? 0;
  const queuedOnly = data?.emails.filter((e) => e.status === "queued").length ?? 0;
  const queuedC = queuedOnly + sendingOnly;
  const successRate = total > 0 ? Math.round((sentC / total) * 100) : 0;
  const sparkData = Array.from({ length: 12 }, (_, i) => Math.round(Math.abs(total * Math.sin(i * 0.8))));

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Delivered" value={String(sentC)} sub={`${successRate}% success rate`} icon={SendIcon} color="#818cf8" chart={<MiniSparkline data={sparkData} color="#818cf8" />} />
        <StatCard label="Failed" value={String(failedC)} sub={String(total > 0 ? Math.round((failedC / total) * 100) : 0) + "% rate"} icon={AlertCircleIcon} color="#ef4444" />
        <StatCard label="In Queue" value={String(queuedC)} sub="Pending delivery" icon={ClockIcon} color="#a1a1aa" />
        <StatCard label="Total" value={String(total)} sub="All time" icon={TrendingUpIcon} color="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="double-bezel">
            <div className="bg-card">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4">
                <p className="font-heading text-sm font-semibold tracking-tight">Email Log</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Status</Label>
                    <Select value={status ?? ""} onValueChange={(v) => { const s = v as string; navigate({ to: "/deliveries", search: { status: (s || undefined) as any, priority } }); }}>
                      <SelectTrigger className="w-28 h-8 glass text-xs">{status ? STATUS_MAP[status]?.label ?? status : "All"}</SelectTrigger>
                      <SelectPopup>
                        <SelectItem value="">All</SelectItem>
                        {["queued", "sending", "sent", "failed", "bounced"].map((s) => <SelectItem key={s} value={s}>{STATUS_MAP[s].label}</SelectItem>)}
                      </SelectPopup>
                    </Select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Priority</Label>
                    <Select value={priority ?? ""} onValueChange={(v) => { const p = v as string; navigate({ to: "/deliveries", search: { status, priority: (p || undefined) as any } }); }}>
                      <SelectTrigger className="w-28 h-8 glass text-xs">{priority === "transactional" ? "Transactional" : priority === "bulk" ? "Bulk" : "All"}</SelectTrigger>
                      <SelectPopup>
                        <SelectItem value="">All</SelectItem>
                        <SelectItem value="transactional">Transactional</SelectItem>
                        <SelectItem value="bulk">Bulk</SelectItem>
                      </SelectPopup>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="border-t border-border/50">
                {data?.emails.length === 0 ? (
                  <div className="py-12"><Empty><EmptyContent><InboxIcon className="size-6 text-muted-foreground" /><EmptyTitle>No emails</EmptyTitle>{!status && !priority && <EmptyDescription>Send one via the API.</EmptyDescription>}</EmptyContent></Empty></div>
                ) : (
                  <>
                    <div className="hidden sm:block">
                      <Table>
                        <TableHeader>
                          <TableRow><TableHead>Status</TableHead><TableHead>To</TableHead><TableHead>Subject</TableHead><TableHead>Priority</TableHead><TableHead>Attempts</TableHead><TableHead>Created</TableHead><TableHead /></TableRow>
                        </TableHeader>
                        <TableBody>
                          {data!.emails.map((email) => (
                            <TableRow key={email.id} className="cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => goDetail(email.id)}>
                              <TableCell><StatusBadge status={email.status} /></TableCell>
                              <TableCell className="max-w-[160px] truncate font-medium">{email.to}</TableCell>
                              <TableCell className="max-w-[200px] truncate text-muted-foreground">{email.subject}</TableCell>
                              <TableCell><Badge variant={email.priority === "transactional" ? "info" : "default"}>{email.priority}</Badge></TableCell>
                              <TableCell className="text-muted-foreground text-xs tabular-nums">{email.attempts}/{email.maxAttempts}</TableCell>
                              <TableCell className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">{email.createdAt ? new Date(email.createdAt).toLocaleDateString() : "-"}</TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                {email.status === "failed" && <Button size="xs" variant="secondary" onClick={() => retryMutation.mutate({ id: email.id })} disabled={retryMutation.isPending}><RefreshCwIcon className="size-3" /> Retry</Button>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="sm:hidden divide-y divide-border/50">
                      {data!.emails.map((email) => (
                        <div key={email.id} className="px-4 py-3 space-y-2 cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => goDetail(email.id)}>
                          <div className="flex items-center justify-between"><StatusBadge status={email.status} /><span className="text-xs text-muted-foreground">{email.createdAt ? new Date(email.createdAt).toLocaleDateString() : "-"}</span></div>
                          <div><p className="text-sm font-medium truncate">{email.to}</p><p className="text-xs text-muted-foreground truncate mt-0.5">{email.subject}</p></div>
                          <div className="flex items-center justify-between"><Badge variant={email.priority === "transactional" ? "info" : "default"} className="text-[10px]">{email.priority}</Badge><span className="text-xs text-muted-foreground tabular-nums">{email.attempts}/{email.maxAttempts}</span></div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="double-bezel">
            <div className="bg-card">
              <div className="p-4 border-b border-border/50">
                <p className="font-heading text-sm font-semibold tracking-tight">Distribution</p>
              </div>
              <div className="p-5 flex items-center gap-5">
                <DonutChart segments={[
                  { value: sentC, color: "#818cf8", label: "Sent" },
                  { value: failedC, color: "#ef4444", label: "Failed" },
                  { value: queuedC, color: "#a1a1aa", label: "Queued" },
                ]} size={130} />
                <div className="space-y-2 flex-1">
                  {[
                    { label: "Delivered", value: sentC, color: "#818cf8" },
                    { label: "Failed", value: failedC, color: "#ef4444" },
                    { label: "Queued", value: queuedC, color: "#a1a1aa" },
                  ].map((item) => {
                    const pct = total > 0 ? (item.value / total) * 100 : 0;
                    return (
                      <div key={item.label} className="space-y-0.5">
                        <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{item.label}</span><span className="font-semibold tabular-nums" style={{ color: item.color }}>{Math.round(pct)}%</span></div>
                        <div className="h-1.5 w-full rounded-full bg-border/50 overflow-hidden"><div className="h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]" style={{ width: `${pct}%`, backgroundColor: item.color }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="double-bezel">
            <div className="bg-card p-4 space-y-3">
              <p className="font-heading text-xs font-semibold tracking-tight text-muted-foreground/80 uppercase tracking-wider">Activity</p>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-2xl font-bold font-heading">{total}</p>
                  <p className="text-[10px] text-muted-foreground/60">Emails processed</p>
                </div>
                <MiniSparkline data={sparkData} color="#818cf8" />
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="text-center p-2 rounded-xl bg-white/[0.03]"><p className="text-xs font-bold font-heading text-emerald-500">{sentC}</p><p className="text-[9px] text-muted-foreground/60">Sent</p></div>
                <div className="text-center p-2 rounded-xl bg-white/[0.03]"><p className="text-xs font-bold font-heading text-red-400">{failedC}</p><p className="text-[9px] text-muted-foreground/60">Failed</p></div>
                <div className="text-center p-2 rounded-xl bg-white/[0.03]"><p className="text-xs font-bold font-heading text-zinc-400">{queuedC}</p><p className="text-[9px] text-muted-foreground/60">Queued</p></div>
              </div>
            </div>
          </div>

          <div className="double-bezel">
            <div className="bg-card p-4 space-y-3">
              <p className="font-heading text-xs font-semibold tracking-tight text-muted-foreground/80 uppercase tracking-wider">Success Rate</p>
              <div className="relative pt-1">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Delivery rate</span>
                  <span className="font-bold font-heading text-lg" style={{ color: successRate > 80 ? "#22c55e" : successRate > 50 ? "#f59e0b" : "#ef4444" }}>{successRate}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-border/50 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]" style={{ width: `${successRate}%`, backgroundColor: successRate > 80 ? "#22c55e" : successRate > 50 ? "#f59e0b" : "#ef4444" }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground/60 mt-1">
                  <span>{sentC} delivered</span>
                  <span>{failedC} failed</span>
                </div>
              </div>
            </div>
          </div>

          <div className="double-bezel">
            <div className="bg-card p-4 space-y-3">
              <p className="font-heading text-xs font-semibold tracking-tight text-muted-foreground/80 uppercase tracking-wider">Queue Status</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Active</span>
                  <span className="font-medium text-amber-400">{sendingOnly} sending</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Pending</span>
                  <span className="font-medium text-zinc-400">{queuedC} queued</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Throughput</span>
                  <span className="font-medium text-emerald-400">{Math.max(1, Math.round(sentC / (total || 1) * 60))}/min</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Retries</span>
                  <span className="font-medium">{data?.emails.filter((e) => e.attempts > 1).length || 0} emails</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
