# Mail Dispatch Service — Operator Guide

An internal service that accepts email send requests, queues them, and delivers them via SMTP over Cloudflare Workers.

## Table of Contents

- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [SMTP Profiles](#smtp-profiles)
- [API Keys](#api-keys)
- [Sending Emails](#sending-emails)
- [Delivery Status & Retries](#delivery-status--retries)
- [Templates](#templates)
- [Rate Limits](#rate-limits)
- [Security](#security)

---

## Quick Start

```sh
# 1. Create an SMTP profile with your mail relay details
#    (host, port, credentials, encryption)

# 2. Generate an API key for your service

# 3. Send your first email
# Uses your default SMTP profile and profile label as sender
curl -X POST https://your-api.com/rpc/email/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "to": "recipient@example.com",
      "subject": "Hello from Mail Dispatch",
      "htmlBody": "<h1>Welcome!</h1>",
      "priority": "transactional"
    }
  }'
```

---

## Core Concepts

| Term | What it means |
|---|---|
| **Mail Dispatch Service** | The system as a whole — accepts send requests, queues them, delivers via SMTP, tracks status |
| **Caller Service** | An internal system that sends emails via the API, authenticating with an API key |
| **Operator** | A human team member who manages SMTP profiles, templates, and monitors delivery |
| **SMTP Profile** | Configuration for a mail relay server (host, port, auth, encryption) |
| **API Key** | Credential that authenticates a caller service |
| **Email Template** | Reusable email design with variable placeholders |
| **Delivery** | A single email send attempt with trackable status |

---

## SMTP Profiles

An SMTP profile points to a mail relay server that actually delivers your emails.

### Fields

| Field | Required | Description |
|---|---|---|
| `label` | Yes | Human-readable name (e.g. "SendGrid Production") |
| `host` | Yes | SMTP server hostname (e.g. smtp.sendgrid.net) |
| `username` | Yes | SMTP authentication username |
| `password` | Yes | SMTP authentication password |
| `authType` | No | `plain`, `login`, or `cram-md5` (default: plain) |
| `encryption` | No | `ssl` (port 465) or `starttls` (port 587) |
| `maxSendsPerMinute` | No | Rate limit for this profile (default: 60) |
| `isDefault` | No | Whether this is the default profile |

You must create at least one SMTP profile before you can send emails.

---

## API Keys

Each caller service should have its own API key. Keys are used in the `Authorization: Bearer` header.

### Best Practices

| ✅ Do | ❌ Don't |
|---|---|
| Create one key per caller service | Share a key across multiple callers |
| Name keys clearly (e.g. "notification-service") | Use generic names like "api-key-1" |
| Revoke keys when a caller is decommissioned | Leave unused keys active |
| Store keys in environment variables or secrets | Hardcode keys in source code or commit them |

### Required Headers

```
Authorization: Bearer <your_api_key>
Content-Type: application/json
```

---

## Sending Emails

### Transactional (high priority)

Use for: password resets, order confirmations, receipts, welcome emails.

- Up to **3 retry attempts** with exponential backoff (10s, 20s, 40s)
- Higher queue priority

```json
{
  "json": {
    "to": "user@example.com",
    "subject": "Your order confirmation",
    "htmlBody": "<h1>Thanks for your order!</h1><p>Your order #1234 has been confirmed.</p>",
    "priority": "transactional"
  }
}
```

### Bulk (low priority)

Use for: newsletters, marketing, announcements, digests.

- **Single attempt** — no retries
- Lower queue priority
- Best-effort delivery

```json
{
  "smtpProfileId": "PROFILE_ID",
  "from": "newsletter@example.com",
  "to": "user@example.com",
  "subject": "Monthly Newsletter",
  "htmlBody": "<h1>Latest updates</h1><p>Here's what's new...</p>",
  "priority": "bulk"
}
```

### Optional Fields

| Field | Type | Description |
|---|---|---|
| `textBody` | string | Plain text fallback for HTML emails |
| `replyTo` | string | Reply-to email address |
| `cc` | string | CC recipient |
| `bcc` | string | BCC recipient |
| `headers` | object | Custom email headers (key-value pairs) |
| `scheduledAt` | number | Unix timestamp for scheduled delivery |

---

## Delivery Status & Retries

### Status values

| Status | Meaning |
|---|---|
| `queued` | Waiting to be processed |
| `sending` | Currently being sent |
| `sent` | Successfully delivered to SMTP relay |
| `failed` | Delivery failed after all retries |
| `bounced` | Email was rejected by the receiving server |

### Checking status

```sh
curl -X POST https://your-api.com/api/email.getStatus \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id": "EMAIL_ID"}'
```

### Manual retry

Failed transactional emails can be retried from the Deliveries dashboard. This resets the attempt count and re-queues the email.

---

## Templates

Templates let you reuse email designs with variable placeholders.

Example template:
```
Subject: Welcome to {{appName}}!
Body: <h1>Hi {{userName}}!</h1><p>Thanks for joining {{appName}}.</p>
```

Variables are specified as a comma-separated list when creating the template (e.g. `userName, appName`).

---

## Rate Limits

- **Per-profile**: configurable via `maxSendsPerMinute` (default: 60)
- **Transactional**: 3 retries with backoff, high priority
- **Bulk**: 1 attempt, low priority

Excess requests are queued and processed as capacity allows.

---

## Security

- Passwords are encrypted at rest using AES-GCM
- API keys use hash-based verification
- Email HTML is sanitized to prevent injection
- Session-based auth for the Operator dashboard
- All API requests require Bearer token authentication

---

## Support

For issues or questions, contact the team that maintains this service.
