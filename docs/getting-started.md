[Back to README](../README.md) · [Architecture →](architecture.md)

# Getting Started

## Prerequisites

- Node.js 20+
- `bun` or `pnpm`
- Vue 3 host app (Nuxt or Laravel + Inertia/Vite)

## Demo App Setup

```bash
bun install
bun run dev:app
```

Open `http://localhost:3000`.

### Local Schema Contract

- File path: `resources/api-docs/api-docs.json`
- Required fields: `openapi`, `info`, `paths`
- Format: valid JSON

Failure behavior:

- Missing file -> API `404`, server logs `WARN`
- Invalid JSON -> API `500`, server logs `ERROR`

## Library Consumer Setup

Install package and peer requirements:

```bash
pnpm add @pepperfm/swagger-nuxt-ui @nuxt/ui @vueuse/core
```

Import styles:

```css
@import "@pepperfm/swagger-nuxt-ui/styles.css";
```

Use component:

```vue
<script setup lang="ts">
import { SwaggerViewer } from '@pepperfm/swagger-nuxt-ui'
</script>

<template>
  <SwaggerViewer schema-source="/api/swagger-ui" base-api-url="/api" />
</template>
```

For Laravel hosts, package postinstall attempts to install the bridge package automatically and expose `/api/swagger-ui`.

Opt-out:

```bash
SWAGGER_UI_SKIP_LARAVEL_BRIDGE=1 bun add @pepperfm/swagger-nuxt-ui
```

## Build Commands

```bash
bun run lint
bun run typecheck
bun run build:app
bun run build:lib
```

## See Also

- [API Reference](api.md)
- [Configuration](configuration.md)
- [Deployment](deployment.md)
