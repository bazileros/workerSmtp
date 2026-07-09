# @workerSmtp/api

oRPC procedures, routers, and input validation for the Mail Dispatch Service.

## Structure

```
src/
├── __tests__/         # Unit tests (vitest)
│   ├── html.test.ts   # HTML sanitizer tests
│   ├── html-edge.test.ts
│   ├── schemas.test.ts
│   └── schemas-edge.test.ts
├── routers/
│   ├── index.ts       # App router (merges all sub-routers)
│   ├── email.ts       # Email send, status, list, retry
│   ├── template.ts    # Template CRUD
│   ├── smtp-profile.ts # SMTP profile CRUD
│   └── api-key.ts     # API key management
├── context.ts         # Request context factory
├── html.ts            # HTML sanitization (sanitize-html)
└── index.ts           # Base procedures (public, protected)
```

## Procedures

All 20+ procedures are available via oRPC RPC at `/rpc/` or OpenAPI at `/api-reference/`. Each procedure has Zod input validation with comprehensive test coverage.

## Testing

```bash
bun run test  # 112+ unit tests covering validation and sanitization
```
