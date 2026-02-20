# Swagger Nuxt UI

> Nuxt 4 demo app + reusable Vue 3 Swagger UI library powered by Nuxt UI 4.

Repository roles:

- **Demo app**: loads local schema from `resources/api-docs/api-docs.json` through `GET /api/swagger-ui` (alias `GET /api/swagger`).
- **Library package**: exports `SwaggerViewer`, reusable cards/navigation components, and typed composables.

## Quick Start (Demo App)

```bash
bun install
bun run dev:app
```

Open `http://localhost:3000`.

## Build Library Artifacts

```bash
bun run build:lib
```

Artifacts are generated in `dist/lib`:

- `index.mjs`
- `index.cjs`
- `types.d.ts`
- `index.css`

## Package API

- Entry: `@pepperfm/swagger-nuxt-ui`
- Styles: `@pepperfm/swagger-nuxt-ui/styles.css`

## Nuxt Consumer Example

```vue
<script setup lang="ts">
import { SwaggerViewer } from '@pepperfm/swagger-nuxt-ui'
</script>

<template>
  <SwaggerViewer
    schema-source="/api/swagger-ui"
    base-api-url="https://api.example.com"
    schema-headline="./resources/api-docs/api-docs.json"
  />
</template>
```

In global CSS:

```css
@import "@pepperfm/swagger-nuxt-ui/styles.css";
```

## Laravel + Inertia/Vite Consumer Example

```vue
<script setup lang="ts">
import { SwaggerViewer } from '@pepperfm/swagger-nuxt-ui'
import '@pepperfm/swagger-nuxt-ui/styles.css'
</script>

<template>
  <SwaggerViewer
    schema-source="/api/swagger-ui"
    base-api-url="/api"
    schema-headline="Local OpenAPI schema"
  />
</template>
```

## Laravel Bridge Auto-Install

On package install, the postinstall script tries to bootstrap a Laravel bridge package in Laravel hosts:

- Composer package: `pepperfm/swagger-ui-laravel-bridge`
- Default bridge route: `/api/swagger-ui`

Optional env flags:

- `SWAGGER_UI_SKIP_LARAVEL_BRIDGE=1` -> skip composer bridge install.
- `SWAGGER_UI_BRIDGE_STRICT=1` -> fail install when bridge bootstrap fails.
- `SWAGGER_UI_BRIDGE_PACKAGE=vendor/package` -> override composer package name.

## Minimal Logging Model

- `WARN`: unsupported schema shape, missing schema source, missing referenced schema nodes.
- `ERROR`: schema load failure and malformed local schema parsing.

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/getting-started.md) | Demo setup and consumer setup |
| [Architecture](docs/architecture.md) | Layered structure and dependency rules |
| [API Reference](docs/api.md) | Endpoint behavior and library API |
| [Configuration](docs/configuration.md) | Runtime and library build configuration |
| [Deployment](docs/deployment.md) | Demo deploy and library release flow |
| [Contributing](docs/contributing.md) | Quality checks and contribution process |

## AI Context

- Project description: `.ai-factory/DESCRIPTION.md`
- Architecture guidelines: `.ai-factory/ARCHITECTURE.md`
- Project map: `AGENTS.md`
