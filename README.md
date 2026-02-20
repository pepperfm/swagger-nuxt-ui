# Swagger Nuxt UI

> Local-first OpenAPI/Swagger documentation viewer built with Nuxt 4 and Nuxt UI 4.

Swagger Nuxt UI reads schema data from `resources/api-docs/api-docs.json` via the internal `GET /api/swagger` endpoint and renders endpoints, request details, response examples, and schema references.

## Quick Start

```bash
bun install
bun run dev
```

Alternative package manager:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Local Schema Workflow

1. Put a valid OpenAPI JSON into `resources/api-docs/api-docs.json`.
2. Start the app.
3. Browse endpoints and schemas from the left navigation.
4. Optionally set `NUXT_BASE_API_URL` to control the copied full endpoint URL.

## Key Features

- **Local schema source**: fixed local file pipeline through `/api/swagger`.
- **Endpoint navigation**: operations grouped by tags.
- **Request/response view**: parameters, request body, security, and examples.
- **Schema browser**: navigation and rendering for `components.schemas`.
- **Typed composables**: loading, navigation derivation, and selected-operation state split into composables.

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/getting-started.md) | Prerequisites, install, run, and first local schema load |
| [Architecture](docs/architecture.md) | Layered structure and dependency rules |
| [API Reference](docs/api.md) | Internal API and composable contracts |
| [Configuration](docs/configuration.md) | Runtime variables and schema file contract |
| [Deployment](docs/deployment.md) | Build, preview, Docker, and VPS workflow |
| [Contributing](docs/contributing.md) | Quality checks and contribution process |

## AI Context

- Project description: `.ai-factory/DESCRIPTION.md`
- Architecture guidelines: `.ai-factory/ARCHITECTURE.md`
- Project map: `AGENTS.md`

## License

No license file is currently defined in this repository.
