[Back to README](../README.md) · [Architecture →](architecture.md)

# Getting Started

## Prerequisites

- Node.js 20+
- `bun` or `pnpm` (`packageManager` is pinned to `pnpm@10.12.1`)

## Installation

```bash
bun install
```

Alternative:

```bash
pnpm install
```

## Run Development Server

```bash
bun run dev
```

Alternative:

```bash
pnpm dev
```

App is available at `http://localhost:3000`.

## First Local Schema Load

1. Ensure `resources/api-docs/api-docs.json` exists.
2. Put a valid OpenAPI 3.x JSON object in that file.
3. Open the app home page; schema is loaded automatically.
4. Browse tags and operations from the sidebar.

## Schema File Contract

- Path: `resources/api-docs/api-docs.json`
- Required top-level fields: `openapi`, `info`, `paths`
- Format: valid JSON (not YAML)

If the file is missing, server returns `404` and logs a `WARN`.
If the file contains invalid JSON, server returns `500` and logs an `ERROR`.

## Useful Commands

```bash
bun run lint
bun run typecheck
bun run build
bun run preview
```

## See Also

- [Architecture](architecture.md) - project layout and dependency boundaries.
- [Configuration](configuration.md) - runtime and app configuration.
- [API Reference](api.md) - server endpoint and composable contracts.
