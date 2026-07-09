import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@workerSmtp/ui/components/card";
import { BookOpenIcon, ChevronDownIcon, CopyIcon, DownloadIcon } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/_admin/docs")({
  component: DocsPage,
});

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" onClick={async () => { await navigator.clipboard.writeText(text); setDone(true); toast.success("Copied"); setTimeout(() => setDone(false), 2000); }} className="absolute top-2 right-2 z-10 flex size-7 items-center justify-center rounded-md bg-muted/80 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
      {done ? <span className="text-[9px] font-semibold">OK</span> : <CopyIcon className="size-3" />}
    </button>
  );
}

function Code({ children, language }: { children: string; language?: string }) {
  return (
    <div className="relative group rounded-lg overflow-hidden border border-border">
      <CopyBtn text={children} />
      <SyntaxHighlighter
        language={language || "bash"}
        style={oneDark}
        customStyle={{ margin: 0, borderRadius: 0, fontSize: "13px", lineHeight: "1.6", padding: "12px 16px" }}
        codeTagProps={{ style: { fontFamily: "inherit" } }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground">{children}</span>;
}

function Req() {
  return <span className="inline-flex items-center rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-500">required</span>;
}
function Opt() {
  return <span className="inline-flex items-center rounded bg-zinc-500/10 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">optional</span>;
}

const CURL_SEND = `curl -X POST http://localhost:3000/rpc/email/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "json": {
      "to": "recipient@example.com",
      "subject": "Hello from Mail Dispatch",
      "htmlBody": "<h1>Welcome!</h1><p>This is a test.</p>",
      "priority": "transactional"
    }
  }'`;

const NODE_SEND = `const response = await fetch("http://localhost:3000/rpc/email/send", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    json: {
      to: "recipient@example.com",
      subject: "Hello from Mail Dispatch",
      htmlBody: "<h1>Welcome!</h1><p>This is a test.</p>",
      priority: "transactional",
    },
  }),
});

const data = await response.json();
console.log(data);`;

const CURL_STATUS = `curl -X POST http://localhost:3000/rpc/email/getStatus \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"json": {"id": "EMAIL_ID"}}'`;

const NODE_STATUS = `const response = await fetch("http://localhost:3000/rpc/email/getStatus", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ json: { id: "EMAIL_ID" } }),
});

const data = await response.json();
console.log(data);`;

const CURL_BULK = `curl -X POST http://localhost:3000/rpc/email/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "json": {
      "to": "user@example.com",
      "subject": "Monthly Newsletter",
      "htmlBody": "<h1>Latest updates</h1><p>Here is what is new...</p>",
      "priority": "bulk"
    }
  }'`;

const CURL_TEMPLATE = `curl -X POST http://localhost:3000/rpc/email/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "json": {
      "templateId": "TEMPLATE_ID",
      "to": "user@example.com",
      "variables": { "userName": "Alice", "appName": "MyApp" },
      "priority": "transactional"
    }
  }'`;

const TEMPLATE_EXAMPLE = `Subject: Welcome to {{appName}}!

Body:
<h1>Hi {{userName}}!</h1>
<p>Thanks for joining {{appName}}.</p>`;

type FieldDef = { name: string; type: string; required: boolean; default?: string; desc: string };
type EndpointDef = { path: string; method: string; auth: string; desc: string; input: FieldDef[]; output: string };

const API_DEFS: Record<string, EndpointDef> = {
   "email.send": {
    path: "email.send", method: "POST", auth: "API Key",
    desc: "Queue an email for delivery through an SMTP profile.",
    input: [
      { name: "to", type: "string | string[]", required: true, desc: "Recipient(s). Array sends to each address individually." },
      { name: "subject", type: "string", required: false, desc: "Email subject (required if no templateId)" },
      { name: "htmlBody", type: "string", required: false, desc: "HTML body. Not needed when using templateId — the template provides it." },
      { name: "textBody", type: "string", required: false, desc: "Plain text fallback. Falls back to template's textBody if omitted." },
      { name: "templateId", type: "string", required: false, desc: "Use a saved template. Resolves {{variable}} placeholders. When set, htmlBody/textBody/subject are optional." },
      { name: "variables", type: "object", required: false, desc: "Key-value pairs for {{variable}} substitution in templates. Only used when templateId is provided." },
      { name: "smtpProfileId", type: "string", required: false, desc: "Profile to use. Omit to use the default profile." },
      { name: "from", type: "string", required: false, desc: "Sender. Omit to use Profile Label <profile-username>." },
      { name: "priority", type: '"transactional" | "bulk"', required: false, default: '"bulk"', desc: "Transactional = 3 retries, Bulk = 1 attempt" },
      { name: "replyTo", type: "string (email)", required: false, desc: "Reply-To address" },
      { name: "cc", type: "string", required: false, desc: "CC recipients (comma-separated)" },
      { name: "bcc", type: "string", required: false, desc: "BCC recipients (comma-separated)" },
      { name: "headers", type: "object", required: false, desc: "Custom headers as key-value pairs" },
      { name: "scheduledAt", type: "number", required: false, desc: "Unix timestamp (ms) for scheduled delivery" },
    ],
    output: '{ "ids": ["email-uuid"] }',
  },
  "email.getStatus": {
    path: "email.getStatus", method: "POST", auth: "API Key",
    desc: "Check the delivery status of an email by its ID.",
    input: [
      { name: "id", type: "string", required: true, desc: "The UUID returned from email.send" },
    ],
    output: '{ "id": "...", "status": "sent|failed|queued|sending|bounced", "attempts": 1, "maxAttempts": 3, "lastError": null, "sentAt": null, "createdAt": "..." }',
  },
  "email.list": {
    path: "email.list", method: "POST", auth: "Session",
    desc: "List emails with optional status/priority filters.",
    input: [
      { name: "limit", type: "number", required: false, default: "50", desc: "Maximum results to return" },
      { name: "offset", type: "number", required: false, default: "0", desc: "Number of results to skip" },
      { name: "status", type: '"queued" | "sending" | "sent" | "failed" | "bounced"', required: false, desc: "Filter by status" },
      { name: "priority", type: '"transactional" | "bulk"', required: false, desc: "Filter by priority" },
    ],
    output: '{ "emails": [...], "total": 100 }',
  },
  "email.retry": {
    path: "email.retry", method: "POST", auth: "Session",
    desc: "Retry a failed email. Only works on emails with status = failed.",
    input: [
      { name: "id", type: "string", required: true, desc: "UUID of the failed email" },
    ],
    output: '{ "id": "...", "status": "queued" }',
  },
  "template.create": {
    path: "template.create", method: "POST", auth: "Session",
    desc: "Create a reusable email template with variable placeholders.",
    input: [
      { name: "name", type: "string", required: true, desc: "Template name" },
      { name: "subject", type: "string", required: true, desc: 'Email subject (use {"{var}"} for placeholders)' },
      { name: "htmlBody", type: "string", required: true, desc: 'HTML body with {"{var}"} placeholders' },
      { name: "textBody", type: "string", required: false, desc: "Plain text fallback" },
      { name: "variables", type: "string[]", required: false, desc: 'Array of variable names, e.g. ["userName","appName"]' },
    ],
    output: '{ "id": "template-uuid" }',
  },
  "template.list": {
    path: "template.list", method: "POST", auth: "Session",
    desc: "List all email templates.",
    input: [],
    output: '{ "templates": [...] }',
  },
  "template.update": {
    path: "template.update", method: "POST", auth: "Session",
    desc: "Partially update a template. Only provided fields are changed.",
    input: [
      { name: "id", type: "string", required: true, desc: "Template UUID" },
      { name: "name", type: "string", required: false, desc: "Updated name" },
      { name: "subject", type: "string", required: false, desc: "Updated subject" },
      { name: "htmlBody", type: "string", required: false, desc: "Updated HTML body" },
      { name: "textBody", type: "string", required: false, desc: "Updated text body" },
      { name: "variables", type: "string[]", required: false, desc: "Updated variables array" },
    ],
    output: '{ "id": "template-uuid" }',
  },
  "template.delete": {
    path: "template.delete", method: "POST", auth: "Session",
    desc: "Delete a template by ID.",
    input: [
      { name: "id", type: "string", required: true, desc: "Template UUID to delete" },
    ],
    output: '{ "id": "template-uuid" }',
  },
  "smtp-profile.create": {
    path: "smtp-profile.create", method: "POST", auth: "Session",
    desc: "Create a new SMTP profile pointing to a mail relay.",
    input: [
      { name: "label", type: "string", required: true, desc: "Human-readable name" },
      { name: "host", type: "string", required: true, desc: "SMTP server hostname" },
      { name: "port", type: "number", required: true, desc: "Port: 465 (SSL) or 587 (STARTTLS)" },
      { name: "username", type: "string", required: true, desc: "SMTP username" },
      { name: "password", type: "string", required: true, desc: "SMTP password (encrypted at rest)" },
      { name: "secure", type: "boolean", required: false, default: "false", desc: "Use SSL/TLS" },
      { name: "startTls", type: "boolean", required: false, default: "true", desc: "Use STARTTLS" },
      { name: "authType", type: '"plain" | "login" | "cram-md5"', required: false, default: '"plain"', desc: "Authentication mechanism" },
      { name: "maxSendsPerMinute", type: "number", required: false, default: "60", desc: "Rate limit for this profile" },
      { name: "isDefault", type: "boolean", required: false, default: "false", desc: "Set as default profile" },
    ],
    output: '{ "id": "profile-uuid" }',
  },
  "smtp-profile.update": {
    path: "smtp-profile.update", method: "POST", auth: "Session",
    desc: "Partially update an SMTP profile.",
    input: [
      { name: "id", type: "string", required: true, desc: "Profile UUID to update" },
      { name: "label", type: "string", required: false, desc: "Updated label" },
      { name: "host", type: "string", required: false, desc: "Updated host" },
      { name: "port", type: "number", required: false, desc: "Updated port" },
      { name: "username", type: "string", required: false, desc: "Updated username" },
      { name: "password", type: "string", required: false, desc: "Updated password (re-encrypted)" },
      { name: "secure", type: "boolean", required: false, desc: "Updated SSL flag" },
      { name: "startTls", type: "boolean", required: false, desc: "Updated STARTTLS flag" },
      { name: "authType", type: '"plain" | "login" | "cram-md5"', required: false, desc: "Updated auth type" },
      { name: "maxSendsPerMinute", type: "number", required: false, desc: "Updated rate limit" },
      { name: "isDefault", type: "boolean", required: false, desc: "Updated default flag" },
    ],
    output: '{ "id": "profile-uuid" }',
  },
  "smtp-profile.list": {
    path: "smtp-profile.list", method: "POST", auth: "Session",
    desc: "List all SMTP profiles.",
    input: [],
    output: '{ "profiles": [...] }',
  },
  "smtp-profile.delete": {
    path: "smtp-profile.delete", method: "POST", auth: "Session",
    desc: "Delete an SMTP profile by ID.",
    input: [
      { name: "id", type: "string", required: true, desc: "Profile UUID to delete" },
    ],
    output: '{ "id": "profile-uuid" }',
  },
  "api-key.create": {
    path: "api-key.create", method: "POST", auth: "Session",
    desc: "Create a new API key for a caller service.",
    input: [
      { name: "name", type: "string", required: true, desc: "Name of the service using this key" },
    ],
    output: '{ "key": "...", "start": "prefix..." }',
  },
  "api-key.list": {
    path: "api-key.list", method: "POST", auth: "Session",
    desc: "List all API keys.",
    input: [],
    output: '{ "apiKeys": [...] }',
  },
  "api-key.revoke": {
    path: "api-key.revoke", method: "POST", auth: "Session",
    desc: "Revoke an API key by its ID.",
    input: [
      { name: "keyId", type: "string", required: true, desc: "ID of the API key to revoke" },
    ],
    output: '{ "keyId": "..." }',
  },
  healthCheck: {
    path: "healthCheck", method: "POST", auth: "Public",
    desc: "Server health check — returns OK if the service is running.",
    input: [],
    output: '"OK"',
  },
  canSignUp: {
    path: "canSignUp", method: "POST", auth: "Public",
    desc: "Check whether registration is open (no Operator exists yet).",
    input: [],
    output: "true | false",
  },
  "privateData": {
    path: "privateData", method: "POST", auth: "Session",
    desc: "Returns the authenticated user's session data.",
    input: [],
    output: '{ "message": "...", "user": { ... } }',
  },
  "template.get": {
    path: "template.get", method: "POST", auth: "Session",
    desc: "Get a single template by its ID.",
    input: [
      { name: "id", type: "string", required: true, desc: "Template UUID" },
    ],
    output: "Full template object",
  },
  "smtp-profile.get": {
    path: "smtp-profile.get", method: "POST", auth: "Session",
    desc: "Get a single SMTP profile by its ID.",
    input: [
      { name: "id", type: "string", required: true, desc: "Profile UUID" },
    ],
    output: "Full profile object (password excluded)",
  },
};

function EndpointRow({ def, defaultOpen }: { def: EndpointDef; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen || false);
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono font-semibold shrink-0">{def.method}</span>
          <span className="font-mono text-[13px] font-medium">{def.path}</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">{def.auth}</span>
        </div>
        <ChevronDownIcon className={`size-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          <p className="text-sm text-muted-foreground">{def.desc}</p>
          {def.input.length > 0 ? (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-2 py-1.5 font-semibold text-foreground text-xs">Field</th>
                    <th className="text-left px-2 py-1.5 font-semibold text-foreground text-xs">Type</th>
                    <th className="text-left px-2 py-1.5 font-semibold text-foreground text-xs w-16" />
                    <th className="text-left px-2 py-1.5 font-semibold text-foreground text-xs">Default</th>
                    <th className="text-left px-2 py-1.5 font-semibold text-foreground text-xs">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {def.input.map((f) => (
                    <tr key={f.name} className="border-b border-border last:border-0">
                      <td className="px-2 py-1.5 font-mono text-xs whitespace-nowrap">{f.name}</td>
                      <td className="px-2 py-1.5 text-xs text-muted-foreground whitespace-nowrap"><code className="text-[10px]">{f.type}</code></td>
                      <td className="px-2 py-1.5">{f.required ? <Req /> : <Opt />}</td>
                      <td className="px-2 py-1.5 text-xs text-muted-foreground font-mono">{f.default || "—"}</td>
                      <td className="px-2 py-1.5 text-xs text-muted-foreground">{f.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No input fields required.</p>
          )}
          <div className="rounded bg-muted/50 px-3 py-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Response</span>
            <p className="text-xs font-mono text-foreground mt-0.5 break-all">{def.output}</p>
          </div>
        </div>
      )}
    </div>
  );
}

const GROUPED = [
  { label: "Public", endpoints: ["healthCheck", "canSignUp"] },
  { label: "Session", endpoints: ["privateData"] },
  { label: "Emails", endpoints: ["email.send", "email.getStatus", "email.list", "email.retry"] },
  { label: "Templates", endpoints: ["template.create", "template.list", "template.get", "template.update", "template.delete"] },
  { label: "SMTP Profiles", endpoints: ["smtp-profile.create", "smtp-profile.list", "smtp-profile.get", "smtp-profile.update", "smtp-profile.delete"] },
  { label: "API Keys", endpoints: ["api-key.create", "api-key.list", "api-key.revoke"] },
];

const FRAMEWORK_SNIPPETS: Record<string, string> = {
  nextjs: [
    '// app/api/send-email/route.ts',
    'import { NextResponse } from "next/server";',
    '',
    'const API_KEY = process.env.MAIL_API_KEY!;',
    'const API_URL = "http://localhost:3000/rpc/email/send";',
    '',
    'export async function POST(req: Request) {',
    '  const { to, subject, htmlBody } = await req.json();',
    '  const res = await fetch(API_URL, {',
    '    method: "POST",',
    '    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },',
    '    body: JSON.stringify({ json: { to, subject, htmlBody, priority: "transactional" } }),',
    '  });',
    '  return NextResponse.json((await res.json()).json);',
    '}',
  ].join("\n"),
  tanstack: [
    '// app/routes/api.send-email.ts',
    'import { json } from "@tanstack/react-start";',
    'import { createAPIFileRoute } from "@tanstack/react-start/api";',
    '',
    'const API_KEY = process.env.MAIL_API_KEY!;',
    '',
    'export const APIRoute = createAPIFileRoute("/api/send-email")({',
    '  POST: async ({ request }) => {',
    '    const { to, subject, htmlBody } = await request.json();',
    '    const res = await fetch("http://localhost:3000/rpc/email/send", {',
    '      method: "POST",',
    '      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },',
    '      body: JSON.stringify({ json: { to, subject, htmlBody, priority: "transactional" } }),',
    '    });',
    '    return json((await res.json()).json);',
    '  },',
    '});',
  ].join("\n"),
  hono: [
    '// src/index.ts',
    'import { Hono } from "hono";',
    'const app = new Hono();',
    'const API_KEY = process.env.MAIL_API_KEY!;',
    '',
    'app.post("/api/send-email", async (c) => {',
    '  const { to, subject, htmlBody } = await c.req.json();',
    '  const res = await fetch("http://localhost:3000/rpc/email/send", {',
    '    method: "POST",',
    '    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },',
    '    body: JSON.stringify({ json: { to, subject, htmlBody, priority: "transactional" } }),',
    '  });',
    '  return c.json((await res.json()).json);',
    '});',
    '',
    'export default app;',
  ].join("\n"),
  elysia: [
    '// src/index.ts',
    'import { Elysia } from "elysia";',
    '',
    'const API_KEY = process.env.MAIL_API_KEY!;',
    '',
    'const app = new Elysia().post("/api/send-email", async ({ body }) => {',
    '  const { to, subject, htmlBody } = body as any;',
    '  const res = await fetch("http://localhost:3000/rpc/email/send", {',
    '    method: "POST",',
    '    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },',
    '    body: JSON.stringify({ json: { to, subject, htmlBody, priority: "transactional" } }),',
    '  });',
    '  return (await res.json()).json;',
    '}).listen(3001);',
  ].join("\n"),
  django: [
    '# app/views.py',
    'import os, json',
    'import requests',
    'from django.http import JsonResponse',
    'from django.views.decorators.csrf import csrf_exempt',
    '',
    'API_KEY = os.environ["MAIL_API_KEY"]',
    '',
    '@csrf_exempt',
    'def send_email(request):',
    '    body = json.loads(request.body)',
    '    resp = requests.post("http://localhost:3000/rpc/email/send",',
    '        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},',
    '        json={"json": {"to": body["to"], "subject": body["subject"],',
    '                       "htmlBody": body.get("htmlBody"), "priority": "transactional"}},',
    '    )',
    '    return JsonResponse(resp.json()["json"])',
  ].join("\n"),
  convex: [
    '// convex/email.ts',
    'import { action } from "./_generated/server";',
    'import { v } from "convex/values";',
    '',
    'const API_KEY = process.env.MAIL_API_KEY!;',
    '',
    'export const send = action({',
    '  args: { to: v.string(), subject: v.string(), htmlBody: v.optional(v.string()) },',
    '  handler: async (_, args) => {',
    '    const res = await fetch("http://localhost:3000/rpc/email/send", {',
    '      method: "POST",',
    '      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },',
    '      body: JSON.stringify({ json: { to: args.to, subject: args.subject,',
    '        htmlBody: args.htmlBody, priority: "transactional" } }),',
    '    });',
    '    return (await res.json()).json;',
    '  },',
    '});',
  ].join("\n"),
  revel: [
    '// app/controllers/email.go',
    'package controllers',
    '',
    'import (',
    '  "bytes"',
    '  "encoding/json"',
    '  "net/http"',
    '  "os"',
    ')',
    '',
    'func SendEmail(w http.ResponseWriter, r *http.Request) {',
    '  var body struct { To string; Subject string; HtmlBody string }',
    '  json.NewDecoder(r.Body).Decode(&body)',
    '',
    '  payload, _ := json.Marshal(map[string]any{',
    '    "json": map[string]any{',
    '      "to": body.To, "subject": body.Subject,',
    '      "htmlBody": body.HtmlBody, "priority": "transactional",',
    '    },',
    '  })',
    '',
    '  req, _ := http.NewRequest("POST",',
    '    "http://localhost:3000/rpc/email/send", bytes.NewBuffer(payload))',
    '  req.Header.Set("Authorization", "Bearer "+os.Getenv("MAIL_API_KEY"))',
    '  req.Header.Set("Content-Type", "application/json")',
    '',
    '  resp, _ := http.DefaultClient.Do(req)',
    '  defer resp.Body.Close()',
    '  var result map[string]any',
    '  json.NewDecoder(resp.Body).Decode(&result)',
    '  json.NewEncoder(w).Encode(result["json"])',
    '}',
  ].join("\n"),
};

function DocsPage() {
  const [exampleLang, setExampleLang] = useState<"curl" | "node">("curl");
  const [framework, setFramework] = useState("nextjs");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground">Documentation</h1>
          <p className="text-sm text-muted-foreground mt-1">Set up and use the Mail Dispatch Service</p>
        </div>
        <a href="/SKILLS.md" download className="flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0 self-start">
          <DownloadIcon className="size-4" />
          Download Guide
        </a>
      </div>

      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {(["curl", "node"] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            data-active={exampleLang === lang || undefined}
            onClick={() => setExampleLang(lang)}
            className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm text-muted-foreground hover:text-foreground"
          >
            {lang === "curl" ? "cURL" : "Node.js fetch"}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BookOpenIcon className="size-4 text-primary shrink-0" /> Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Step n={1} title="Create an SMTP Profile">Open <Link to="/profiles" className="text-primary hover:underline font-medium">SMTP Profiles</Link> and add your mail relay.</Step>
          <Step n={2} title="Generate an API Key">Open <Link to="/api-keys" className="text-primary hover:underline font-medium">API Keys</Link>. Each caller service gets its own key. Store it in env vars.</Step>
          <Step n={3} title="Send your first email">Use the examples below. You need the Profile ID and your API key.</Step>
          <Step n={4} title="Monitor & Retry">Track status on <Link to="/deliveries" className="text-primary hover:underline font-medium">Deliveries</Link>. Failed transactional emails can be retried.</Step>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BookOpenIcon className="size-4 text-primary shrink-0" /> API Reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {GROUPED.map((group) => (
            <div key={group.label} className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{group.label}</p>
              {group.endpoints.map((key) => (
                <EndpointRow key={key} def={API_DEFS[key]} />
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BookOpenIcon className="size-4 text-primary shrink-0" /> Framework Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit overflow-x-auto">
            {(["nextjs", "tanstack", "hono", "elysia", "django", "convex", "revel"] as const).map((fw) => (
              <button
                key={fw}
                type="button"
                data-active={framework === fw || undefined}
                onClick={() => setFramework(fw)}
                className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm text-muted-foreground hover:text-foreground"
              >
                {fw === "nextjs" ? "Next.js" : fw === "tanstack" ? "TanStack Start" : fw.charAt(0).toUpperCase() + fw.slice(1)}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Copy this into your project. Replace <Badge>MAIL_API_KEY</Badge> with your key.</p>
            <Code language={framework === "django" ? "python" : framework === "revel" ? "go" : "typescript"}>{FRAMEWORK_SNIPPETS[framework]}</Code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BookOpenIcon className="size-4 text-primary shrink-0" /> Send an Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Replace <Badge>PROFILE_ID</Badge> and <Badge>YOUR_API_KEY</Badge> with your values:</p>
          <Code language={exampleLang === "curl" ? "bash" : "javascript"}>{exampleLang === "curl" ? CURL_SEND : NODE_SEND}</Code>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs font-semibold text-foreground mb-1">Response</p>
            <p className="text-xs font-mono text-muted-foreground">{'{"id": "550e8400-e29b-41d4-a716-446655440000"}'}</p>
            <p className="text-xs text-muted-foreground mt-1">Save this ID to track delivery status.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BookOpenIcon className="size-4 text-primary shrink-0" /> Track Delivery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Code language={exampleLang === "curl" ? "bash" : "javascript"}>{exampleLang === "curl" ? CURL_STATUS : NODE_STATUS}</Code>
          <p className="text-sm text-muted-foreground">Status values: <Badge>queued</Badge> <Badge>sending</Badge> <Badge>sent</Badge> <Badge>failed</Badge> <Badge>bounced</Badge></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BookOpenIcon className="size-4 text-primary shrink-0" /> Bulk Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">For newsletters and announcements. Lower priority, no retries.</p>
          <Code language={exampleLang === "curl" ? "bash" : "javascript"}>{exampleLang === "curl" ? CURL_BULK : NODE_SEND}</Code>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BookOpenIcon className="size-4 text-primary shrink-0" /> Send with Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Use a saved template with <Badge>{'{{variable}}'}</Badge> placeholders. Variables are resolved automatically.</p>
          <Code language="bash">{CURL_TEMPLATE}</Code>
          <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">How it works</p>
            <p>1. Create a template on the <strong className="text-foreground">Templates</strong> page (e.g. with <code className="text-[10px] font-mono">{'{{userName}}'}</code> and <code className="text-[10px] font-mono">{'{{appName}}'}</code> placeholders). Set <strong className="text-foreground">Variables</strong> field to the placeholder names.</p>
            <p className="mt-1">2. Send with <code className="text-[10px] font-mono">templateId</code> and <code className="text-[10px] font-mono">variables</code> only — no need to send <code className="text-[10px] font-mono">htmlBody</code> or <code className="text-[10px] font-mono">subject</code>. The API fetches the template and resolves all <code className="text-[10px] font-mono">{'{{variable}}'}</code> patterns automatically.</p>
            <p className="mt-1">3. <code className="text-[10px] font-mono">htmlBody</code>, <code className="text-[10px] font-mono">textBody</code>, and <code className="text-[10px] font-mono">subject</code> from the template are used. You can override any of them by providing them explicitly in the request.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><BookOpenIcon className="size-4 text-primary shrink-0" /> Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Reusable email designs with <Badge>{'{variable}'}</Badge> placeholders.</p>
          <Code language="text">{TEMPLATE_EXAMPLE}</Code>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 sm:p-5">
        <div className="flex items-start gap-3 min-w-0">
          <BookOpenIcon className="size-5 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Download the operator guide</p>
            <p className="text-sm text-muted-foreground">Markdown file with everything above</p>
          </div>
        </div>
        <a href="/SKILLS.md" download className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 w-full sm:w-auto justify-center">
          <DownloadIcon className="size-4" />
          Download
        </a>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/5 text-xs font-semibold text-primary/70 mt-0.5">{n}</span>
      <div className="space-y-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
