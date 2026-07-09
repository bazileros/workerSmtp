# @workerSmtp/env

Environment variable validation using [@t3-oss/env-core](https://env.t3.gg/).

## Packages

| Export | Runtime | File |
|---|---|---|
| `@workerSmtp/env/server` | Server/Worker | `src/server.ts` |
| `@workerSmtp/env/web` | Browser/Vite | `src/web.ts` |

## Required Environment Variables

### Server (`apps/server/.env`)

| Variable | Type | Description |
|---|---|---|
| `BETTER_AUTH_SECRET` | `string` | Secret key for session encryption and password encryption. Generate with `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | `string` (URL) | Public URL of the server (e.g. `http://localhost:3000` for dev) |
| `CORS_ORIGIN` | `string` (URL) | Allowed CORS origin for the web app (e.g. `http://localhost:3001`) |
| `DB` | `D1Database` | Cloudflare D1 database binding (provisioned by Alchemy) |
| `MAIL_QUEUE` | `Queue` | Cloudflare Queue binding for email processing (provisioned by Alchemy) |
| `MAIL_KV` | `KVNamespace` | Cloudflare KV namespace binding (provisioned by Alchemy) |

### Web (`apps/web/.env`)

| Variable | Type | Description |
|---|---|---|
| `VITE_SERVER_URL` | `string` (URL) | URL of the API server (e.g. `http://localhost:3000` for dev) |

## Usage

```ts
// Server-side
import { env } from "@workerSmtp/env/server";
console.log(env.CORS_ORIGIN);
console.log(env.BETTER_AUTH_SECRET);

// Client-side (Vite)
import { env } from "@workerSmtp/env/web";
console.log(env.VITE_SERVER_URL);
```

## Example `.env` Files

### `apps/server/.env`

```env
BETTER_AUTH_SECRET=your-secret-key-at-least-32-chars
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3001
```

### `apps/web/.env`

```env
VITE_SERVER_URL=http://localhost:3000
```
