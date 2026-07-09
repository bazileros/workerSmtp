<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/bazileros/workerSmtp/main/apps/web/public/Worker_SMTP_dark.png">
    <img alt="worker SMTP" src="https://raw.githubusercontent.com/bazileros/workerSmtp/main/apps/web/public/Worker_SMTP_light.png" width="120" height="120">
  </picture>
</p>

<h1 align="center">worker SMTP</h1>

<p align="center">
  <strong>An internal email dispatch service</strong><br />
  Accepts send requests, queues them, and delivers via SMTP on Cloudflare Workers.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> •
  <a href="#packages">Packages</a> •
  <a href="#sending-an-email">Send Email</a> •
  <a href="#deployment">Deploy</a> •
  <a href="#testing">Testing</a>
</p>

---

## Overview

worker SMTP is a full-stack internal service for sending emails through SMTP relays. It provides a REST API for callers, an admin dashboard for operators, and handles queueing, retries, and delivery tracking.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Web App    │────▶│    Server    │────▶│  SMTP Relay  │
│  (React SPA) │     │  (Workers)   │     │              │
│  :3001       │◀────│  :3000       │     │  (external)  │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                     ┌──────▼───────┐
                     │     Queue    │
                     │  (async)     │
                     └──────────────┘
```

## Features

- **API-first** — RESTful email sending via oRPC with full TypeScript types
- **Queue-based delivery** — Async processing with retries and dead-letter queues
- **Template engine** — Reusable HTML templates with `{{variable}}` substitution
- **Operator dashboard** — Manage profiles, templates, API keys, and monitor deliveries
- **Multi-profile** — Multiple SMTP relays with automatic default fallback
- **Auth** — API keys for callers, session-based auth for operators
- **Cloudflare-native** — Workers, Queues, D1, KV — all on Cloudflare

## Quick Start

```bash
git clone https://github.com/zalisile/workerSmtp.git
cd workerSmtp
bun install
bun run dev
```

| Service | URL | Description |
|---|---|---|
| **Web** | [http://localhost:3001](http://localhost:3001) | Operator dashboard |
| **Server** | [http://localhost:3000](http://localhost:3000) | API server |

## Packages

| Package | README | Description |
|---|---|---|
| `apps/web` | [README](./apps/web/README.md) | React SPA with TanStack Router, Query, shadcn/ui |
| `apps/server` | [README](./apps/server/README.md) | Hono + oRPC API server on Cloudflare Workers |
| `packages/api` | [README](./packages/api/README.md) | oRPC procedures, routers, input validation |
| `packages/auth` | [README](./packages/auth/README.md) | Better Auth (email/password + API keys) |
| `packages/db` | [README](./packages/db/README.md) | Drizzle ORM schema, Cloudflare D1 |
| `packages/env` | [README](./packages/env/README.md) | Environment variable validation |
| `packages/ui` | [README](./packages/ui/README.md) | Shared shadcn/ui components |

## Sending an Email

```bash
curl -X POST https://smtp-server.surestrat.xyz/rpc/email/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "to": "user@example.com",
      "subject": "Hello from worker SMTP",
      "htmlBody": "<h1>Hello!</h1><p>This is a test.</p>",
      "priority": "transactional"
    }
  }'
```

### Using a template

```bash
curl -X POST https://smtp-server.surestrat.xyz/rpc/email/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "templateId": "TEMPLATE_UUID",
      "to": "user@example.com",
      "variables": { "userName": "Alice", "appName": "MyApp" },
      "priority": "transactional"
    }
  }'
```

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start all apps in development mode |
| `bun run build` | Build all apps for production |
| `bun run test` | Run unit tests (112+ tests) |
| `bun run test:e2e` | Run Playwright E2E tests (43 tests) |
| `bun run check-types` | TypeScript type checking |
| `bun run deploy` | Deploy to Cloudflare |
| `bun run destroy` | Destroy Cloudflare deployment |
| `bun run generate:secret` | Generate a BETTER_AUTH_SECRET |

## Environment

```bash
# apps/server/.env
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3001

# apps/web/.env
VITE_SERVER_URL=http://localhost:3000
```

## Deployment

```bash
# Deploy to Cloudflare Workers
bun run deploy

# Tear down
bun run destroy
```

The deployment uses [Alchemy](https://alchemy.run) to provision:
- **D1 Database** — SQLite for email/template/profile storage
- **Queues** — Async email delivery with dead-letter queue
- **KV** — Key-value storage for auth sessions
- **Workers** — Server (Hono + oRPC) and Web (Vite SPA)

## Testing

```bash
bun run test         # 112 unit tests (vitest)
bun run test:e2e     # 43 E2E tests (Playwright)
bun run test:watch   # Watch mode
```

**Test coverage:**
- HTML sanitizer edge cases (XSS, injection, script stripping)
- Input validation schemas (email.send, template, profile, api-key)
- E2E: auth flows, HTTP methods, path traversal, security attacks
- Security: SQL/NoSQL injection, XSS, SSRF, prototype pollution, header injection, IDOR

## Tech Stack

**Frontend:** React 19, TanStack Router, TanStack Query, Tailwind CSS v4, shadcn/ui, Monaco Editor

**Backend:** Hono, oRPC, Drizzle ORM, Better Auth, Cloudflare D1/Queues/KV

**Tooling:** Bun, TypeScript, Vite, Playwright, Vitest, Biome

---

<p align="center">
  <sub>Built with ❤️ using the Better-T-Stack</sub>
</p>
