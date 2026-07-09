# Contributing

Thank you for considering contributing to **worker SMTP**. This document outlines the guidelines and workflow.

## Code of Conduct

Be respectful, inclusive, and constructive. Harassment or toxic behavior will not be tolerated.

## How to Contribute

1. **Fork** the repository
2. **Create a branch** for your feature or fix
3. **Write tests** for your changes
4. **Run the test suite** before submitting
5. **Open a pull request** with a clear description

## Development Setup

```bash
# Install dependencies
bun install

# Start dev environment
bun run dev

# Run unit tests
bun run test

# Run E2E tests
bun run test:e2e

# Type check
bun run check-types
```

## Project Structure

```
├── apps/
│   ├── web/          # React SPA (TanStack Router + shadcn/ui)
│   └── server/       # API server (Hono + oRPC on Cloudflare Workers)
├── packages/
│   ├── api/          # oRPC procedures and routers
│   ├── auth/         # Better Auth configuration
│   ├── db/           # Database schema and migrations (Drizzle ORM)
│   ├── env/          # Environment variable validation
│   ├── ui/           # Shared UI components (shadcn/ui)
│   └── infra/        # Infrastructure (Alchemy / Cloudflare)
├── e2e/              # Playwright E2E tests
└── vitest.config.ts  # Vitest configuration
```

## Architecture

- **Server** runs on Cloudflare Workers via Hono. It handles API requests via oRPC (RPC protocol) and OpenAPI.
- **Web** is a Vite + React SPA using TanStack Router for routing and TanStack Query for data fetching.
- **Emails** are queued via Cloudflare Queues and processed asynchronously by a worker consumer.

## Adding a New Procedure

1. Add the procedure to the appropriate router in `packages/api/src/routers/`
2. Register it in `packages/api/src/routers/index.ts`
3. Add input validation tests in `packages/api/src/__tests__/`
4. Add E2E tests in `e2e/`

## Testing

```bash
# Unit tests (vitest)
bun run test

# E2E tests (Playwright — starts dev server automatically)
bun run test:e2e
```

## Pull Request Checklist

- [ ] Code follows existing patterns
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] Types are valid (`bun run check-types`)
- [ ] Docs updated if applicable
