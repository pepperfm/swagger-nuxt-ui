[Back to README](../README.md) · [Architecture →](architecture.md)

# Getting Started

## Prerequisites

- Node.js 20+
- `pnpm` (project is pinned to `pnpm@10.12.1`)

## Installation

```bash
pnpm install
```

## Run Development Server

```bash
pnpm dev
```

App is available at `http://localhost:3000`.

## First Schema Load

1. Open the home page.
2. Enter a reachable OpenAPI JSON URL.
3. Enter the base API URL used to construct full endpoint links.
4. Click fetch/load action in the UI.
5. Browse tags and operations from the sidebar.

## Useful Commands

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm preview
```

## See Also

- [Architecture](architecture.md) - project layout and dependency boundaries.
- [Configuration](configuration.md) - runtime and app configuration.
- [API Reference](api.md) - server endpoint and composable contracts.
