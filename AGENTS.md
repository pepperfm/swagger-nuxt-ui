# AGENTS.md

> Project map for AI agents. Keep this file up-to-date as the project evolves.

## Project Overview
Nuxt 4 + Nuxt UI 4 repository with dual purpose:

- Demo application for browsing local OpenAPI schema.
- Reusable Vue library package (`@pepper_fm/swagger-nuxt-ui`) sourced from `lib/`.
- Laravel bridge Composer package (`pepperfm/swagger-ui-laravel-bridge`) sourced from `packages/l5-swagger-ui-bridge`.

## Tech Stack
- **Language:** TypeScript, PHP
- **Framework:** Nuxt 4 (Vue 3), Laravel bridge package
- **UI:** Nuxt UI 4
- **Packaging:** Vite library mode + standalone Vite viewer build
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
├── components/                    # Library-owned UI components (SwaggerViewer, global auth panel, request emulator cards/editors, navigation, schema cards)
├── composables/                   # Library-owned composables (schema/navigation/selection/request emulator, global authorization + parameter/body resolvers)
└── styles/swagger-ui.css          # Library stylesheet

bridge-viewer/
├── main.ts                        # Standalone browser entrypoint for Laravel page
├── App.vue                        # Page shell: UHeader + UMain + UFooter + dark mode
└── styles.css                     # Tailwind + Nuxt UI + green theme + viewer styles

server/
└── api/
    ├── swagger.ts                 # Local schema reader endpoint
    └── swagger-ui.ts              # Alias endpoint matching bridge route

resources/
└── api-docs/api-docs.json         # Local OpenAPI source

packages/l5-swagger-ui-bridge/
├── composer.json
├── config/swagger-ui-bridge.php
├── resources/
│   ├── assets/                    # viewer.js/viewer.css distributed with bridge package
│   └── views/viewer.blade.php     # Zero-config HTML page shell
├── routes/swagger-ui.php          # GET /api/swagger-ui and GET /swagger-ui routes
└── src/
    ├── SwaggerUiBridgeServiceProvider.php
    ├── SchemaPathResolver.php
    └── Http/Controllers/
        ├── SwaggerSchemaController.php
        ├── SwaggerViewerPageController.php
        └── BridgeAssetController.php

scripts/
├── cli/install-bridge.mjs         # Public CLI command (bin) for bridge bootstrap
├── install-laravel-bridge.mjs     # Composer bridge installer with path mode
├── sync-bridge-viewer-assets.mjs  # Copies dist/viewer assets into bridge package
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
| `package.json` | Scripts and package metadata for app + library + viewer asset builds |
| `vite.lib.config.ts` | Library bundle configuration |
| `vite.viewer.config.ts` | Standalone viewer bundle configuration |
| `lib/index.ts` | Library public API exports |
| `lib/components/EndpointRequestCard.vue` | Endpoint request emulator UI (right sidebar) |
| `lib/components/RequestBodyEditor.vue` | Dual-mode request body editor (`JSON` / `Form`) |
| `lib/components/RequestBodyFormFields.vue` | Typed field renderer for request body form mode |
| `lib/components/ParameterInputField.vue` | Typed parameter input renderer (Nuxt UI control mapping) |
| `lib/components/ViewerAuthorizationPanel.vue` | Global authorization editor shown from PageHeader `Authorize` action |
| `lib/composables/useRequestEmulator.ts` | Request state, validation, and execution flow |
| `lib/composables/useViewerAuthorization.ts` | Global OpenAPI security credentials state + requirement resolution |
| `lib/composables/navigationAnchor.ts` | Canonical anchor model + URL/hash/query deep-link parsing helpers |
| `lib/composables/requestBodyInputResolver.ts` | OpenAPI requestBody schema -> form input map resolver |
| `lib/composables/requestBodyFormState.ts` | Request body form state init/hydration/serialization helpers |
| `lib/composables/requestParameterInputResolver.ts` | OpenAPI parameter schema -> input control/value resolver |
| `bridge-viewer/main.ts` | Browser entry used by Laravel bridge page |
| `packages/l5-swagger-ui-bridge/routes/swagger-ui.php` | Bridge route registration for JSON + page + assets |
| `packages/l5-swagger-ui-bridge/src/Http/Controllers/SwaggerViewerPageController.php` | Renders `/swagger-ui` page |
| `packages/l5-swagger-ui-bridge/src/Http/Controllers/BridgeAssetController.php` | Serves offline viewer assets |
| `scripts/cli/install-bridge.mjs` | CLI entrypoint for Laravel bridge bootstrap |

## Documentation
| Document | Path | Description |
|----------|------|-------------|
| README | `README.md` | Overview and zero-config Laravel flow |
| Getting Started | `docs/getting-started.md` | Local run and consumer setup |
| Architecture | `docs/architecture.md` | Layering and dependency boundaries |
| API Reference | `docs/api.md` | Endpoint and library contracts |
| Configuration | `docs/configuration.md` | Runtime/build/bridge config |
| Deployment | `docs/deployment.md` | Release workflow and smoke checks |
| Contributing | `docs/contributing.md` | Validation checklist |

## AI Context Files
| File | Purpose |
|------|---------|
| `AGENTS.md` | This project map |
| `.ai-factory/DESCRIPTION.md` | Project specification and stack |
| `.ai-factory/ARCHITECTURE.md` | Architecture rules and boundaries |
| `.ai-factory/plans/*.md` | Implementation plans and progress |
