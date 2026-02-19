# Swagger Nuxt UI

> Interactive OpenAPI/Swagger documentation viewer built with Nuxt 4 and Nuxt UI 4.

Swagger Nuxt UI loads an OpenAPI JSON document from a URL and renders endpoints, request details, response examples, and schema references in a clean navigation-first interface.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000` and provide:
- `Swagger JSON URL`
- `Base API URL`

## Key Features

- **Schema Loader**: fetches remote OpenAPI JSON via `/api/swagger`.
- **Endpoint Navigation**: groups operations by tags for fast browsing.
- **Request/Response View**: shows parameters, request body, auth, and example responses.
- **Schema Browser**: navigates `components.schemas` definitions.
- **Developer UX**: local URL persistence and one-click endpoint URL copy.

## Example

```text
Swagger JSON URL: https://petstore3.swagger.io/api/v3/openapi.json
Base API URL:     https://petstore3.swagger.io/api/v3
```

After loading, select an operation from the left navigation and copy the full endpoint URL from the details panel.

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/getting-started.md) | Prerequisites, install, run, and first load |
| [Architecture](docs/architecture.md) | Layered structure and dependency rules |
| [API Reference](docs/api.md) | Internal API and data flow |
| [Configuration](docs/configuration.md) | Runtime variables and config files |
| [Deployment](docs/deployment.md) | Build, preview, Docker, and VPS workflow |
| [Contributing](docs/contributing.md) | Quality checks and contribution process |

## AI Context

- Project description: `.ai-factory/DESCRIPTION.md`
- Architecture guidelines: `.ai-factory/ARCHITECTURE.md`
- Project map: `AGENTS.md`

## License

No license file is currently defined in this repository.
