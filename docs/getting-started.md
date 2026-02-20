[Back to README](../README.md) · [Architecture →](architecture.md)

# Getting Started

## Prerequisites

- Node.js 20+
- `bun` (or `npm`)
- Laravel host only if bridge flow is needed

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

```bash
bun add @pepper_fm/swagger-nuxt-ui
```

Use component:

```vue
<script setup lang="ts">
import { SwaggerViewer } from '@pepper_fm/swagger-nuxt-ui'
import '@pepper_fm/swagger-nuxt-ui/styles.css'
</script>

<template>
  <SwaggerViewer schema-source="/api/swagger-ui" base-api-url="/api" />
</template>
```

## Laravel Zero-Config Bridge Setup

Run installer in Laravel host project:

```bash
bunx swagger-ui-bridge-install
```

Expected result:

- `GET /swagger-ui` -> viewer page
- `GET /api/swagger-ui` -> OpenAPI JSON

### Local Bridge Development Mode

```bash
bunx swagger-ui-bridge-install --path /absolute/path/to/packages/laravel-bridge --constraint @dev
```

Useful options:

- `--project-root /path/to/laravel`
- `--package pepperfm/swagger-ui-laravel-bridge`
- `--strict`

## Build Commands

```bash
bun run lint
bun run typecheck
bun run build:app
bun run build:lib
bun run build:bridge-assets
```

## See Also

- [API Reference](api.md)
- [Configuration](configuration.md)
- [Deployment](deployment.md)
