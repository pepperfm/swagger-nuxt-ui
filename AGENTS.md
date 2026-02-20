# AGENTS.md

> Project map for AI agents. Keep this file up-to-date as the project evolves.

## Project Overview
Nuxt 4 + Nuxt UI 4 repository with dual purpose:

- Demo application for browsing local OpenAPI schema.
- Reusable Vue library package (`@pepperfm/swagger-nuxt-ui`) sourced from `lib/`.
- Laravel bridge Composer package (`pepperfm/swagger-ui-laravel-bridge`) sourced from `packages/laravel-bridge`.

## Tech Stack
- **Language:** TypeScript
- **Framework:** Nuxt 4 (Vue 3)
- **UI:** Nuxt UI 4
- **Packaging:** Vite library mode + `vue-tsc`
- **Database:** None
- **ORM:** None

## Project Structure
```text
app/
├── app.vue
├── app.config.ts
├── assets/css/main.css
├── components/                    # Adapters to lib components
├── composables/                   # Adapters to lib composables
├── pages/index.vue                # Demo page consuming SwaggerViewer from lib
└── types/types.d.ts               # App-level type aliases/contracts

lib/
├── index.ts                       # Public package API
├── types.ts                       # Public OpenAPI contracts
├── components/                    # Library-owned UI components
├── composables/                   # Library-owned composables
└── styles/swagger-ui.css          # Library stylesheet

server/
└── api/
    ├── swagger.ts                 # Local schema reader endpoint
    └── swagger-ui.ts              # Alias endpoint matching bridge route

resources/
└── api-docs/api-docs.json         # Local OpenAPI source

packages/laravel-bridge/
├── composer.json                  # Bridge package manifest (auto-discovery)
├── config/swagger-ui-bridge.php   # Bridge route/schema config
├── routes/swagger-ui.php          # GET /api/swagger-ui route registration
└── src/                           # Service provider, resolver, controller

scripts/
├── postinstall.mjs                # npm lifecycle orchestration
├── install-laravel-bridge.mjs     # Best-effort composer bridge installer
└── lib/                           # Script helpers

docs/
├── getting-started.md
├── architecture.md
├── api.md
├── configuration.md
├── deployment.md
└── contributing.md
```

## Key Entry Points
| File | Purpose |
|------|---------|
| `package.json` | Scripts and package metadata for app + library builds |
| `vite.lib.config.ts` | Library bundle configuration |
| `tsconfig.lib.json` | Library declaration build configuration |
| `lib/index.ts` | Library public API exports |
| `lib/components/SwaggerViewer.vue` | Main reusable viewer component |
| `app/pages/index.vue` | Demo host integration of library |
| `server/api/swagger.ts` | Local schema endpoint implementation |
| `server/api/swagger-ui.ts` | Demo alias route (`/api/swagger-ui`) |
| `packages/laravel-bridge/src/SwaggerUiBridgeServiceProvider.php` | Laravel bridge service provider |
| `scripts/postinstall.mjs` | npm postinstall orchestration for bridge bootstrap |

## Documentation
| Document | Path | Description |
|----------|------|-------------|
| README | `README.md` | Overview of demo and library usage |
| Getting Started | `docs/getting-started.md` | Local run and consumer setup |
| Architecture | `docs/architecture.md` | Layering and dependency boundaries |
| API Reference | `docs/api.md` | Server endpoint and library API |
| Configuration | `docs/configuration.md` | Runtime/build configuration |
| Deployment | `docs/deployment.md` | Demo deploy and release workflow |
| Contributing | `docs/contributing.md` | Validation checklist |

## AI Context Files
| File | Purpose |
|------|---------|
| `AGENTS.md` | This project map |
| `.ai-factory/DESCRIPTION.md` | Project specification and stack |
| `.ai-factory/ARCHITECTURE.md` | Architecture rules and boundaries |
| `.ai-factory/plans/*.md` | Implementation plans and progress |
