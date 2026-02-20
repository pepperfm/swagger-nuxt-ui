# AGENTS.md

> Project map for AI agents. Keep this file up-to-date as the project evolves.

## Project Overview
Nuxt 4 application for loading and browsing OpenAPI/Swagger schemas with a Nuxt UI interface.

Primary behavior is in client-side Vue composables and page logic, with a small server endpoint that reads the local schema file from `resources/api-docs/api-docs.json`.

## Tech Stack
- **Language:** TypeScript
- **Framework:** Nuxt 4 (Vue 3)
- **UI:** Nuxt UI 4
- **Database:** None
- **ORM:** None

## Project Structure
```text
app/
├── app.vue                        # Global app layout (UApp, header, footer)
├── app.config.ts                  # Nuxt UI app-level configuration
├── assets/css/main.css            # Global styles
├── components/                    # Reusable UI elements for docs rendering
├── composables/
│   ├── useOpenApiSchema.ts        # Schema loading and error state
│   ├── useSwaggerNavigation.ts    # Endpoint/schema navigation derivation
│   ├── useSelectedOperation.ts    # Selected item + endpoint details derivation
│   ├── schemaExample.ts           # Example payload generation from schema
│   └── useCopy.ts                 # Clipboard helper
├── pages/
│   └── index.vue                  # Main API docs page
└── types/
    └── types.d.ts                 # OpenAPI/Swagger TypeScript contracts

server/
└── api/
    └── swagger.ts                 # Local schema reader endpoint

resources/
└── api-docs/
    └── api-docs.json              # Local OpenAPI schema source

public/
├── favicon.ico
└── logo.svg

docs/                              # Project documentation pages
├── getting-started.md
├── architecture.md
├── api.md
├── configuration.md
├── deployment.md
└── contributing.md

.codex/skills/                     # Project-local Codex skills (AI Factory suite)
.claude/skills/                    # Project-local Claude skills (AI Factory suite)
```

## Key Entry Points
| File | Purpose |
|------|---------|
| `nuxt.config.ts` | Core Nuxt modules, runtime config, route rules, and lint config |
| `app/app.vue` | Global UI shell and SEO meta setup |
| `app/pages/index.vue` | Main OpenAPI viewer flow and endpoint/schema selection logic |
| `app/composables/useOpenApiSchema.ts` | Schema fetch/state composable used by the page |
| `app/composables/useSwaggerNavigation.ts` | Navigation derivation for endpoints and schemas |
| `app/composables/useSelectedOperation.ts` | Selection state and derived operation metadata |
| `server/api/swagger.ts` | Server-side local schema file reader |
| `package.json` | Scripts and dependency manifest |

## Documentation
| Document | Path | Description |
|----------|------|-------------|
| README | `README.md` | Project landing page and docs index |
| Getting Started | `docs/getting-started.md` | Install, run, and first local schema load |
| Architecture | `docs/architecture.md` | Layering, boundaries, and data flow |
| API Reference | `docs/api.md` | Internal API endpoint and composables |
| Configuration | `docs/configuration.md` | Runtime config and environment variables |
| Deployment | `docs/deployment.md` | Build/deploy workflow and Docker usage |
| Contributing | `docs/contributing.md` | Contribution and validation checklist |
| Project Description | `.ai-factory/DESCRIPTION.md` | Project specification and detected stack |
| Architecture | `.ai-factory/ARCHITECTURE.md` | Architecture decisions and development rules |

## AI Context Files
| File | Purpose |
|------|---------|
| `AGENTS.md` | This file — project structure map |
| `.ai-factory/DESCRIPTION.md` | Project specification and tech stack |
| `.ai-factory/ARCHITECTURE.md` | Architecture decisions and guidelines |
| `.ai-factory.json` | AI Factory agent skill/mcp install state |
| `.mcp.json` | Project-level MCP server configuration |
