# @workerSmtp/server

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/bazileros/workerSmtp/main/apps/web/public/Worker_SMTP_dark.png">
    <img alt="worker SMTP" src="https://raw.githubusercontent.com/bazileros/workerSmtp/main/apps/web/public/Worker_SMTP_light.png" width="80" height="80">
  </picture>
</p>

<h3 align="center">Hono • oRPC • Cloudflare Workers • D1 • Queues</h3>

Cloudflare Worker backend for the Mail Dispatch Service. Handles API requests, email queueing, and SMTP delivery.

## Tech Stack

| Layer | Technology |
|---|---|
| **HTTP** | Hono (lightweight, fast) |
| **API Layer** | oRPC (RPC + OpenAPI) |
| **Database** | Cloudflare D1 via Drizzle ORM |
| **Queue** | Cloudflare Queues (async delivery) |
| **Auth** | Better Auth (email/password + API keys) |
| **Email** | Worker Mailer (SMTP) |

## Architecture

```
HTTP Request → Hono App → oRPC Handler → Procedure
                                              │
                                    ┌─────────▼────────┐
                                    │  Insert email row │
                                    │  Push to Queue    │
                                    └─────────┬────────┘
                                              │
                                    ┌─────────▼────────┐
                                    │  Queue Consumer   │
                                    │  processQueueBatch│
                                    └─────────┬────────┘
                                              │
                                    ┌─────────▼────────┐
                                    │  Worker Mailer    │
                                    │  SMTP → Send     │
                                    └──────────────────┘
```

## API Endpoints

All RPC endpoints use `POST /rpc/{procedure}`.

| Endpoint | Auth | Description |
|---|---|---|
| `POST /rpc/healthCheck` | Public | Server health check |
| `POST /rpc/canSignUp` | Public | Check if registration is open |
| `POST /rpc/email/send` | API Key | Queue an email for delivery |
| `POST /rpc/email/getStatus` | API Key | Check delivery status by ID |
| `POST /rpc/email/list` | Session | List emails with filters |
| `POST /rpc/email/retry` | Session | Retry a failed email |
| `POST /rpc/template/*` | Session | Template CRUD |
| `POST /rpc/smtp-profile/*` | Session | SMTP profile CRUD |
| `POST /rpc/api-key/*` | Session | API key management |

## Email send input

| Field | Required | Description |
|---|---|---|
| `to` | ✅ | Recipient email(s). Array sends individually. |
| `subject` | ✅* | Email subject (not required with templateId) |
| `htmlBody` | | HTML content (not required with templateId) |
| `textBody` | | Plain text fallback |
| `templateId` | | Use a saved template with `{{var}}` resolution |
| `variables` | | Key-value pairs for template substitution |
| `smtpProfileId` | | Profile to use. Omit for default. |
| `from` | | Sender. Omit → `ProfileLabel <username>` |
| `priority` | | `transactional` (3 retries) or `bulk` (1 attempt) |

## Queue Worker

Emails are processed asynchronously via Cloudflare Queues. The `queue()` handler consumes messages and calls `processQueueBatch` which sends each email through the configured SMTP profile. Failed transactional emails are retried with exponential backoff.
