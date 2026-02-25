# Swagger Nuxt UI

> Nuxt 4 demo app + reusable Vue 3 Swagger UI library powered by Nuxt UI 4.

Repository roles:

- Demo app: loads local schema from `resources/api-docs/api-docs.json` through `GET /api/swagger-ui` (alias `GET /api/swagger`).
- Library package: exports `SwaggerViewer`, reusable cards/navigation components, and typed composables.
- Laravel bridge package: serves zero-config viewer page at `GET /swagger-ui` and JSON at `GET /api/swagger-ui`.
- Endpoint request emulator: Swagger-like right sidebar for sending endpoint requests directly from docs UI.

## Quick Start (Demo App)

```bash
bun install
bun run dev:app
```

Open `http://localhost:3000`.

## Known Issues

### Bun lockfile warning on Bun 1.3.9

In this repository, Bun may report a lockfile parse error for transitive Tiptap peers
(`@tiptap/y-tiptap` -> `y-protocols`), then continue with `warn: Ignoring lockfile`.

Current project workaround:

- Use `bun install` (regular install)
- Avoid `bun install -f` for this repo
- If needed: remove `bun.lock` and run `bun install` again

## Laravel Zero-Config Flow

After installing the npm package in a Laravel host project:

```bash
bunx swagger-ui-bridge-install
```

Then open:

- `GET /swagger-ui` -> viewer UI
- `GET /api/swagger-ui` -> raw OpenAPI JSON

No host-side Vue/Inertia code is required.

### Local Bridge Development (`--path`)

Use path-repo mode to install bridge from local filesystem:

```bash
bunx swagger-ui-bridge-install --path /absolute/path/to/packages/l5-swagger-ui-bridge --constraint @dev
```

Optional flags:

- `--project-root /path/to/laravel`
- `--package pepperfm/swagger-ui-laravel-bridge`
- `--strict`

Env equivalents:

- `SWAGGER_UI_SKIP_LARAVEL_BRIDGE=1`
- `SWAGGER_UI_BRIDGE_STRICT=1`
- `SWAGGER_UI_BRIDGE_PACKAGE=vendor/package`
- `SWAGGER_UI_BRIDGE_PATH=/abs/path/to/bridge`
- `SWAGGER_UI_BRIDGE_CONSTRAINT=@dev`

## Build Artifacts

```bash
bun run build:lib
bun run build:bridge-assets
```

Generated outputs:

- `dist/lib/*` -> npm library bundle
- `dist/viewer/viewer.js` + `dist/viewer/viewer.css` -> standalone viewer build
- `packages/l5-swagger-ui-bridge/resources/assets/*` -> bridge-distributed viewer assets

## Nuxt/Vue Consumer Example

```vue
<script setup lang="ts">
import { SwaggerViewer } from '@pepper_fm/swagger-nuxt-ui'
import '@pepper_fm/swagger-nuxt-ui/styles.css'
</script>

<template>
  <SwaggerViewer
    schema-source="/api/swagger-ui"
    base-api-url="/api"
    :enable-request-emulator="true"
    :request-timeout-ms="15000"
  />
</template>
```

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/getting-started.md) | Demo setup and zero-config Laravel flow |
| [Architecture](docs/architecture.md) | Layered structure and dependency rules |
| [API Reference](docs/api.md) | Endpoint behavior and library API |
| [Configuration](docs/configuration.md) | Runtime and bridge/library configuration |
| [Deployment](docs/deployment.md) | Release flow and smoke checklist |
| [Contributing](docs/contributing.md) | Quality checks and contribution process |

## AI Context

- Project description: `.ai-factory/DESCRIPTION.md`
- Architecture guidelines: `.ai-factory/ARCHITECTURE.md`
- Project map: `AGENTS.md`
