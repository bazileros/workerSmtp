# @workerSmtp/web

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../public/Worker_SMTP_dark.png">
    <img alt="worker SMTP" src="../public/Worker_SMTP_light.png" width="80" height="80">
  </picture>
</p>

<h3 align="center">Operator Dashboard • Email Log • Templates • SMTP Profiles</h3>

React SPA for the Mail Dispatch Service. Built with TanStack Router, TanStack Query, Tailwind CSS v4, and shadcn/ui.

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 |
| **Routing** | TanStack Router (file-based, full type safety) |
| **Data Fetching** | TanStack Query + oRPC client |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Build** | Vite 8 with Rolldown |
| **Editor** | Monaco Editor (Catppuccin theme) |
| **Charts** | Custom SVG (donut, sparklines) |

## Routes

| Path | Description |
|---|---|
| `/login` | Sign in / sign up (first user creates account) |
| `/deliveries` | Email delivery dashboard with stats & charts |
| `/deliveries/$id` | Email detail view (payload, headers, HTML preview) |
| `/templates` | Email template CRUD with Monaco editor + preview |
| `/profiles` | SMTP relay management with test functionality |
| `/api-keys` | API key management for caller services |
| `/docs` | API documentation with framework integration guides |

## Key Features

- **Real-time updates** — Email list auto-refreshes when items are queued/sending
- **HTML Preview** — Live template rendering with Tailwind CDN and variable substitution
- **Double-Bezel UI** — Premium card architecture with glass morphism
- **Responsive** — Mobile-adaptive layouts with collapsible sidebar
- **PWA** — Progressive Web App with offline support

## Scripts

```bash
bun run dev              # Dev server (port 3001)
bun run build            # Production build
bun run check-types      # TypeScript checking
bun run generate-pwa-assets  # PWA icon generation
```
