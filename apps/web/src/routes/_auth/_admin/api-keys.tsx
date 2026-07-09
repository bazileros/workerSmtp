import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@workerSmtp/ui/components/badge";
import { Button } from "@workerSmtp/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workerSmtp/ui/components/card";
import { Empty, EmptyContent, EmptyDescription, EmptyTitle } from "@workerSmtp/ui/components/empty";
import { Input } from "@workerSmtp/ui/components/input";
import { Label } from "@workerSmtp/ui/components/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workerSmtp/ui/components/table";
import { CheckCircleIcon, CopyIcon, EyeIcon, EyeOffIcon, KeyIcon, PlusIcon, RotateCcwIcon, TagIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/_admin/api-keys")({
  component: ApiKeysPage,
});

function ApiKeysPage() {
  const queryClient = useQueryClient();
  const apiKeys = useQuery(orpc["api-key"].list.queryOptions());
  const createMutation = useMutation(orpc["api-key"].create.mutationOptions({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc["api-key"].key() }),
  }));
  const revokeMutation = useMutation(orpc["api-key"].revoke.mutationOptions({
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc["api-key"].key() }),
  }));

  const [keyName, setKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await createMutation.mutateAsync({ name: keyName });
      setNewKeyValue(result.key);
      setKeyName("");
      toast.success("API key created", { duration: 5000 });
    } catch { toast.error("Failed to create API key"); }
  }

  async function handleRevoke(keyId: string) {
    try {
      await revokeMutation.mutateAsync({ keyId });
      setConfirmRevoke(null);
      toast.success("API key revoked");
    } catch { toast.error("Failed to revoke API key"); }
  }

  async function copyKey() {
    if (newKeyValue) {
      await navigator.clipboard.writeText(newKeyValue);
      toast.success("Copied to clipboard");
    }
  }

  function dismissKey() {
    setNewKeyValue(null);
  }

  return (
    <div className="space-y-5">
      {newKeyValue && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 relative">
          <button
            type="button"
            onClick={dismissKey}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground text-xs"
          >
            Dismiss
          </button>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 shrink-0">
              <KeyIcon className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground mb-1">Key created successfully</p>
              <p className="text-xs text-muted-foreground mb-3">Copy this key now — it won't be shown again.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-muted px-3 py-2.5 font-mono text-xs break-all leading-relaxed select-all">
                  {newKeyValue}
                </code>
                <Button size="sm" variant="secondary" onClick={copyKey} className="shrink-0">
                  <CopyIcon className="size-3.5" />
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PlusIcon className="size-4 text-primary" />
            Create API Key
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="keyName" className="text-sm font-medium">Key Name</Label>
              <div className="relative">
                <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input id="keyName" value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="e.g. notification-service" required className="h-10 pl-9" />
              </div>
            </div>
            <Button type="submit" size="lg" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Generating..." : "Generate Key"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active API Keys</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {apiKeys.isPending ? (
            <div className="space-y-3 px-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : apiKeys.data?.apiKeys.length === 0 ? (
            <Empty>
              <EmptyContent>
                <KeyIcon className="size-8 text-muted-foreground" />
                <EmptyTitle>No API keys yet</EmptyTitle>
                <EmptyDescription>Create a key for each service that needs to send emails.</EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key Prefix</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.data?.apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{(key.start ?? key.prefix)?.slice(0, 8) || "..."}</code>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                      {key.createdAt
                        ? new Date(typeof key.createdAt === "number" ? key.createdAt : key.createdAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {key.enabled !== false ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <span className="size-1.5 rounded-full bg-muted-foreground" />
                          Revoked
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {key.enabled !== false && (
                        <div className="flex items-center gap-1">
                          {confirmRevoke === key.id ? (
                            <>
                              <Button size="xs" variant="destructive" onClick={() => handleRevoke(key.id)} disabled={revokeMutation.isPending}>
                                Confirm
                              </Button>
                              <Button size="xs" variant="ghost" onClick={() => setConfirmRevoke(null)}>
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button size="xs" variant="destructive" onClick={() => setConfirmRevoke(key.id)}>
                              <Trash2Icon className="size-3" />
                              Revoke
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
