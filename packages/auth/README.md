# @workerSmtp/auth

Authentication configuration using [Better Auth](https://better-auth.com). Handles email/password sign-in, session management, and API key authentication.

## Setup

Better Auth is configured with:

- **Email & Password** authentication
- **API Key** plugin for caller service auth
- **Drizzle adapter** for SQLite (Cloudflare D1)
- **Database hooks** to restrict sign-up to first Operator only

## Usage

```ts
import { createAuth } from "@workerSmtp/auth";

const auth = createAuth();
const session = await auth.api.getSession({ headers: req.headers });
const keys = await auth.api.listApiKeys({ headers: req.headers });
```
