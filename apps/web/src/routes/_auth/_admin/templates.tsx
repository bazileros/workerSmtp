import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@workerSmtp/ui/components/badge";
import { Button } from "@workerSmtp/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workerSmtp/ui/components/card";
import { Empty, EmptyContent, EmptyDescription, EmptyTitle } from "@workerSmtp/ui/components/empty";
import { Input } from "@workerSmtp/ui/components/input";
import { Label } from "@workerSmtp/ui/components/label";
import { Separator } from "@workerSmtp/ui/components/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workerSmtp/ui/components/table";
import { Textarea } from "@workerSmtp/ui/components/textarea";
import Editor, { type BeforeMount } from "@monaco-editor/react";
import { BellIcon, CreditCardIcon, EyeIcon, FileTextIcon, HelpCircleIcon, KeyIcon, MailIcon, MegaphoneIcon, PencilIcon, PlusIcon, ShoppingCartIcon, TagsIcon, Trash2Icon, TypeIcon, UserMinusIcon, UserPlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/_admin/templates")({
  component: TemplatesPage,
});

const PRESETS = [
  {
    name: "Welcome Email",
    icon: UserPlusIcon,
    subject: "Welcome to {{appName}}, {{userName}}!",
    htmlBody: `<div class="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
  <div class="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-center">
    <h1 class="text-3xl font-bold text-white">Welcome to {{appName}}!</h1>
    <p class="text-blue-200 mt-2">We're thrilled to have you</p>
  </div>
  <div class="px-8 py-6 text-gray-700 leading-relaxed">
    <p class="text-lg">Hi <strong>{{userName}}</strong>,</p>
    <p class="mt-4">Thanks for joining <strong>{{appName}}</strong>. Your account has been created successfully and you're all set to get started.</p>
    <div class="mt-6 text-center">
      <a href="{{dashboardUrl}}" class="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors no-underline">Go to Dashboard</a>
    </div>
    <hr class="my-6 border-gray-200" />
    <p class="text-sm text-gray-500">If you didn't create this account, please ignore this email.</p>
  </div>
</div>`,
    textBody: `Welcome to {{appName}}, {{userName}}!\n\nThanks for joining {{appName}}. Your account has been created successfully.\n\nGo to Dashboard: {{dashboardUrl}}`,
    variables: ["userName", "appName", "dashboardUrl"],
  },
  {
    name: "Password Reset",
    icon: KeyIcon,
    subject: "Reset your {{appName}} password",
    htmlBody: `<div class="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
  <div class="bg-amber-500 px-8 py-6 text-center">
    <h1 class="text-2xl font-bold text-white">Password Reset</h1>
  </div>
  <div class="px-8 py-6 text-gray-700 leading-relaxed">
    <p class="text-lg">Hi <strong>{{userName}}</strong>,</p>
    <p class="mt-4">We received a request to reset your <strong>{{appName}}</strong> password. Click the button below to create a new one.</p>
    <div class="mt-6 text-center">
      <a href="{{resetUrl}}" class="inline-block bg-amber-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-colors no-underline">Reset Password</a>
    </div>
    <p class="mt-4 text-sm text-gray-500">This link expires in <strong>{{expiresIn}}</strong>. If you didn't request this, you can safely ignore this email.</p>
    <hr class="my-6 border-gray-200" />
    <p class="text-sm text-gray-500">Need help? <a href="mailto:support@{{appDomain}}" class="text-amber-600">{{appDomain}}</a></p>
  </div>
</div>`,
    textBody: `Reset your {{appName}} password\n\nHi {{userName}},\n\nWe received a request to reset your {{appName}} password.\n\nReset here: {{resetUrl}}\n\nThis link expires in {{expiresIn}}.`,
    variables: ["userName", "appName", "resetUrl", "expiresIn", "appDomain"],
  },
  {
    name: "Login Code",
    icon: BellIcon,
    subject: "Your {{appName}} login code",
    htmlBody: `<div class="max-w-xl mx-auto bg-white rounded-xl shadow-md overflow-hidden text-center">
  <div class="bg-emerald-500 px-8 py-6">
    <h1 class="text-2xl font-bold text-white">Verify it's you</h1>
  </div>
  <div class="px-8 py-6 text-gray-700 leading-relaxed">
    <p class="text-lg">Hi <strong>{{userName}}</strong>,</p>
    <p class="mt-2">Enter this code to sign in to your <strong>{{appName}}</strong> account:</p>
    <div class="my-6">
      <span class="inline-block text-4xl font-bold tracking-[0.25em] text-emerald-600 bg-emerald-50 px-8 py-4 rounded-xl">{{verificationCode}}</span>
    </div>
    <p class="text-sm text-gray-500">This code expires in {{expiresIn}}. Never share this code with anyone.</p>
    <hr class="my-6 border-gray-200" />
    <p class="text-sm text-gray-500">If you didn't request this, <a href="{{supportUrl}}" class="text-emerald-600">let us know</a>.</p>
  </div>
</div>`,
    textBody: `Your {{appName}} login code: {{verificationCode}}\n\nEnter this code to sign in. It expires in {{expiresIn}}.`,
    variables: ["userName", "appName", "verificationCode", "expiresIn", "supportUrl"],
  },
  {
    name: "Order Confirmation",
    icon: ShoppingCartIcon,
    subject: "Order #{{orderId}} confirmed — {{appName}}",
    htmlBody: `<div class="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
  <div class="bg-green-600 px-8 py-6 text-center">
    <div class="text-4xl mb-2">&#10003;</div>
    <h1 class="text-2xl font-bold text-white">Order Confirmed!</h1>
    <p class="text-green-200">Order #{{orderId}}</p>
  </div>
  <div class="px-8 py-6 text-gray-700 leading-relaxed">
    <p class="text-lg">Thanks <strong>{{userName}}</strong>!</p>
    <p class="mt-2">Your order has been placed and is being processed.</p>
    <div class="mt-4 rounded-lg bg-gray-50 p-4 text-sm space-y-1">
      <p><strong>Item:</strong> {{itemName}}</p>
      <p><strong>Quantity:</strong> {{quantity}}</p>
      <p><strong>Total:</strong> {{total}}</p>
      <p><strong>Estimated delivery:</strong> {{deliveryDate}}</p>
    </div>
    <div class="mt-6 text-center">
      <a href="{{orderUrl}}" class="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors no-underline">Track Order</a>
    </div>
  </div>
</div>`,
    textBody: `Order #{{orderId}} confirmed!\n\nThanks {{userName}}!\n\nItem: {{itemName}}\nQty: {{quantity}}\nTotal: {{total}}\nDelivery: {{deliveryDate}}\n\nTrack: {{orderUrl}}`,
    variables: ["userName", "appName", "orderId", "itemName", "quantity", "total", "deliveryDate", "orderUrl"],
  },
  {
    name: "Invoice",
    icon: CreditCardIcon,
    subject: "Invoice #{{invoiceId}} from {{appName}}",
    htmlBody: `<div class="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
  <div class="px-8 py-6 border-b border-gray-200 flex items-center justify-between">
    <h1 class="text-xl font-bold text-gray-800">{{appName}}</h1>
    <span class="text-sm text-gray-500">Invoice #{{invoiceId}}</span>
  </div>
  <div class="px-8 py-6 text-gray-700 leading-relaxed">
    <p>Hi <strong>{{userName}}</strong>,</p>
    <p class="mt-2">Your invoice for {{billingPeriod}} is ready.</p>
    <div class="mt-4 rounded-lg border border-gray-200 divide-y divide-gray-200 text-sm">
      <div class="flex items-center justify-between px-4 py-3"><span>{{itemName}}</span><span>{{amount}}</span></div>
    </div>
    <div class="mt-3 flex items-center justify-between text-sm font-semibold px-1">
      <span>Total Paid</span>
      <span class="text-lg text-green-600">{{total}}</span>
    </div>
    <div class="mt-6 text-center">
      <a href="{{invoiceUrl}}" class="inline-block bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors no-underline">View Invoice</a>
    </div>
    <hr class="my-6 border-gray-200" />
    <p class="text-sm text-gray-500">Questions? <a href="mailto:billing@{{appDomain}}" class="text-gray-800">billing@{{appDomain}}</a></p>
  </div>
</div>`,
    textBody: `Invoice #{{invoiceId}}\n\nHi {{userName}},\n\n{{itemName}}: {{amount}}\nTotal: {{total}}\n\nView: {{invoiceUrl}}`,
    variables: ["userName", "appName", "invoiceId", "billingPeriod", "itemName", "amount", "total", "invoiceUrl", "appDomain"],
  },
  {
    name: "Marketing",
    icon: MegaphoneIcon,
    subject: "{{title}} — {{appName}}",
    htmlBody: `<div class="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
  <div class="bg-gradient-to-br from-purple-600 to-pink-500 px-8 py-12 text-center">
    <h1 class="text-3xl font-bold text-white">{{headline}}</h1>
    <p class="text-purple-200 mt-3 text-lg">{{subheadline}}</p>
  </div>
  <div class="px-8 py-6 text-gray-700 leading-relaxed">
    <p>{{bodyText}}</p>
    <div class="mt-6 text-center">
      <a href="{{ctaUrl}}" class="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors no-underline">{{ctaLabel}}</a>
    </div>
    <hr class="my-6 border-gray-200" />
    <p class="text-xs text-gray-400 text-center">You're receiving this because you subscribed to {{appName}}.<br /><a href="{{unsubscribeUrl}}" class="text-gray-500 underline">Unsubscribe</a></p>
  </div>
</div>`,
    textBody: `{{headline}}\n\n{{bodyText}}\n\n{{ctaLabel}}: {{ctaUrl}}\n\nUnsubscribe: {{unsubscribeUrl}}`,
    variables: ["appName", "title", "headline", "subheadline", "bodyText", "ctaUrl", "ctaLabel", "unsubscribeUrl"],
  },
  {
    name: "Account Deletion",
    icon: UserMinusIcon,
    subject: "Your {{appName}} account has been deleted",
    htmlBody: `<div class="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
  <div class="bg-red-500 px-8 py-6 text-center">
    <h1 class="text-2xl font-bold text-white">Account Deleted</h1>
  </div>
  <div class="px-8 py-6 text-gray-700 leading-relaxed">
    <p>Hi <strong>{{userName}}</strong>,</p>
    <p class="mt-4">Your <strong>{{appName}}</strong> account has been permanently deleted as requested.</p>
    <div class="mt-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
      <p><strong>Account:</strong> {{userEmail}}</p>
      <p><strong>Deleted on:</strong> {{deletionDate}}</p>
    </div>
    <p class="mt-4 text-sm">If this was a mistake, you have <strong>{{gracePeriod}}</strong> to contact support and recover your data.</p>
    <div class="mt-6 text-center">
      <a href="{{supportUrl}}" class="inline-block bg-gray-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors no-underline">Contact Support</a>
    </div>
  </div>
</div>`,
    textBody: `Your {{appName}} account has been deleted.\n\nAccount: {{userEmail}}\nDeleted: {{deletionDate}}\n\nContact support: {{supportUrl}}`,
    variables: ["userName", "appName", "userEmail", "deletionDate", "gracePeriod", "supportUrl"],
  },
];

const defineCatppuccinTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme("catppuccin-mocha", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6c7086" },
      { token: "keyword", foreground: "cba6f7" },
      { token: "string", foreground: "a6e3a1" },
      { token: "number", foreground: "fab387" },
      { token: "tag", foreground: "f38ba8" },
      { token: "attribute.name", foreground: "89b4fa" },
      { token: "attribute.value", foreground: "a6e3a1" },
      { token: "delimiter", foreground: "9399b2" },
      { token: "htmltag", foreground: "f38ba8" },
    ],
    colors: {
      "editor.background": "#1e1e2e",
      "editor.foreground": "#cdd6f4",
      "editor.lineHighlightBackground": "#2a2a3c",
      "editor.selectionBackground": "#45475a",
      "editor.inactiveSelectionBackground": "#313244",
      "editorCursor.foreground": "#f5e0dc",
      "editorLineNumber.foreground": "#585b70",
      "editorLineNumber.activeForeground": "#9399b2",
      "editorGutter.background": "#1e1e2e",
      "editor.selectionHighlightBackground": "#45475a80",
      "editorBracketMatch.background": "#45475a",
      "editorBracketMatch.border": "#6c7086",
      "scrollbarSlider.background": "#45475a",
      "scrollbarSlider.hoverBackground": "#585b70",
      "scrollbarSlider.activeBackground": "#6c7086",
      "editorWidget.background": "#1e1e2e",
      "editorWidget.border": "#313244",
      "input.background": "#313244",
      "input.border": "#45475a",
      "list.activeSelectionBackground": "#313244",
      "list.hoverBackground": "#2a2a3c",
    },
  });
};

function TemplatesPage() {
  const queryClient = useQueryClient();
  const templates = useQuery(orpc.template.list.queryOptions());
  const createMutation = useMutation(orpc.template.create.mutationOptions());
  const updateMutation = useMutation(orpc.template.update.mutationOptions());
  const deleteMutation = useMutation(orpc.template.delete.mutationOptions());

  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [textBody, setTextBody] = useState("");
  const [variables, setVariables] = useState("");
  const [preview, setPreview] = useState(false);
  const [varValues, setVarValues] = useState<Record<string, string>>({});

  function resetForm() {
    setEditId(null);
    setName("");
    setSubject("");
    setHtmlBody("");
    setTextBody("");
    setVariables("");
  }

  function fillForm(t: NonNullable<typeof templates.data>["templates"][number]) {
    setEditId(t.id);
    setName(t.name ?? "");
    setSubject(t.subject);
    setHtmlBody(t.htmlBody);
    setTextBody(t.textBody ?? "");
    setVariables((t.variables as string[])?.join(", ") ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const vars = variables.split(",").map((v) => v.trim()).filter(Boolean);
    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, name, subject, htmlBody, textBody: textBody || undefined, variables: vars.length > 0 ? vars : undefined });
        toast.success("Template updated");
      } else {
        await createMutation.mutateAsync({ name, subject, htmlBody, textBody: textBody || undefined, variables: vars.length > 0 ? vars : undefined });
        toast.success("Template created");
      }
      resetForm();
      queryClient.invalidateQueries({ queryKey: orpc.template.key() });
    } catch {
      toast.error("Failed to save template");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Template deleted");
      queryClient.invalidateQueries({ queryKey: orpc.template.key() });
    } catch {
      toast.error("Failed to delete template");
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {editId ? <PencilIcon className="size-4 text-primary" /> : <PlusIcon className="size-4 text-primary" />}
            {editId ? "Edit Template" : "Create Template"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Template Presets</span>
                <div className="group relative inline-flex">
                  <HelpCircleIcon className="size-3 text-muted-foreground cursor-help" />
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-64 rounded-lg border border-border bg-popover p-3 text-xs text-popover-foreground shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-10">
                    <p className="font-medium mb-1">How variables work</p>
                    <p>When sending an email, replace {"{{variable}}"} placeholders in the template with actual values before calling the API. The template stores the blueprint; your application does the substitution.</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {PRESETS.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => { setName(p.name); setSubject(p.subject); setHtmlBody(p.htmlBody); setTextBody(p.textBody ?? ""); setVariables(p.variables.join(", ")); setEditId(null); }}
                      className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-left transition-all hover:border-primary/50 hover:bg-accent/50 hover:shadow-sm active:scale-[0.98] group"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{p.variables.length} variables</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Template Name</Label>
                <div className="relative">
                  <TypeIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Welcome Email" required className="h-10 pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium">Email Subject</Label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Welcome to {{appName}}!" required className="h-10 pl-9" />
                </div>
                <p className="text-xs text-muted-foreground">Use <code className="rounded bg-muted px-1 py-0.5 text-[10px] font-mono">{`{variable}`}</code> for placeholders</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="htmlBody" className="text-sm font-medium">HTML Body</Label>
                <button
                  type="button"
                  onClick={() => setPreview(!preview)}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <EyeIcon className="size-3.5" />
                  {preview ? "Code" : "Preview"}
                </button>
              </div>
              {preview ? (
                <div className="space-y-3">
                  {variables.trim() && (
                    <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-border bg-card">
                      {variables.split(",").map((v) => v.trim()).filter(Boolean).map((v) => (
                        <div key={v} className="flex items-center gap-1.5">
                          <span className="text-xs font-mono text-muted-foreground">{v}</span>
                          <input
                            value={varValues[v] ?? ""}
                            onChange={(e) => setVarValues((p) => ({ ...p, [v]: e.target.value }))}
                            placeholder={`{{${v}}}`}
                            className="h-7 w-28 rounded-md border border-input bg-background px-2 text-xs font-mono outline-none focus-visible:border-ring"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="rounded-lg border border-input bg-white overflow-hidden min-h-[300px]">
                    <iframe
                      title="Email preview"
                      className="w-full min-h-[300px]"
                      srcDoc={(() => {
                        let rendered = htmlBody || "";
                        for (const [k, v] of Object.entries(varValues)) {
                          if (v) rendered = rendered.replaceAll(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, "gi"), v);
                        }
                        rendered = rendered.replace(/\{\{(\w+)\}\}/g, (_, name) => varValues[name] || `<span style="color:#f59e0b;font-weight:600;background:#fef3c7;padding:0 4px;border-radius:3px">{{${name}}}</span>`);
                        return rendered ? `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><script src="https://cdn.tailwindcss.com"><\/script><style>body{margin:0;padding:16px;font-family:system-ui,-apple-system,sans-serif;background:#f5f5f5}*{box-sizing:border-box}<\/style></head><body>${rendered}</body></html>` : "<html><body><p style='color:#888;font-family:sans-serif;padding:2rem'>No content</p></body></html>";
                      })()}
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-input overflow-hidden">
                  <Editor
                    height="300px"
                    language="html"
                    theme="catppuccin-mocha"
                    value={htmlBody}
                    beforeMount={defineCatppuccinTheme}
                    onChange={(val) => setHtmlBody(val ?? "")}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      fontLigatures: true,
                      lineNumbers: "on",
                      tabSize: 2,
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      formatOnPaste: true,
                      formatOnType: true,
                      suggest: { showKeywords: true, showSnippets: true },
                      bracketPairColorization: { enabled: true },
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="textBody" className="text-sm font-medium">Plain Text Body <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea id="textBody" rows={5} value={textBody} onChange={(e) => setTextBody(e.target.value)} className="min-h-[100px] resize-y" placeholder="Welcome! Thanks for joining..." />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="variables" className="text-sm font-medium">Template Variables</Label>
              <div className="relative">
                <TagsIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input id="variables" value={variables} onChange={(e) => setVariables(e.target.value)} placeholder="userName, orderId, amount" className="h-10 pl-9" />
              </div>
              <p className="text-xs text-muted-foreground">Comma-separated list of variable names used in your template</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" size="lg" disabled={createMutation.isPending || updateMutation.isPending}>
                {editId ? "Update Template" : "Create Template"}
              </Button>
              {editId && (
                <Button type="button" variant="ghost" size="lg" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Templates</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {templates.isPending ? (
            <div className="space-y-3 px-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : templates.data?.templates.length === 0 ? (
            <Empty>
              <EmptyContent>
                <FileTextIcon className="size-8 text-muted-foreground" />
                <EmptyTitle>No templates yet</EmptyTitle>
                <EmptyDescription>Create one to reuse email designs with variable placeholders.</EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Variables</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.data?.templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{t.subject}</TableCell>
                    <TableCell>
                      {(t.variables as string[])?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {(t.variables as string[]).map((v) => (
                            <Badge key={v}>{v}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="xs" variant="secondary" onClick={() => fillForm(t)}>
                          <PencilIcon className="size-3" />
                          Edit
                        </Button>
                        <Button size="xs" variant="destructive" onClick={() => handleDelete(t.id)}>
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
    </div>
  );
}
