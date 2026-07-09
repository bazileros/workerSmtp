# @workerSmtp/db

Database schema, migrations, and client setup using [Drizzle ORM](https://orm.drizzle.team) with Cloudflare D1 (SQLite).

## Schema

| Table | Description |
|---|---|
| `email` | Email queue items with status tracking |
| `smtp_profile` | SMTP relay configurations |
| `template` | Reusable email templates with variables |
| `user` | Better Auth users |
| `session` | Better Auth sessions |
| `api_key` | Better Auth API keys |
| `account` | Better Auth accounts (OAuth) |
| `verification` | Better Auth email verification |

## Migrations

```bash
bun run db:generate  # Generate migration from schema changes
```

Migrations are applied automatically by Alchemy during `dev` and `deploy`.
