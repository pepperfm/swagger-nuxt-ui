[← Getting Started](getting-started.md) · [Back to README](../README.md) · [API Reference →](api.md)

# Architecture

## Overview

The repository uses layered architecture with two top-level modules:

- **Demo app module** (`app/`, `server/`, `resources/`)
- **Library module** (`lib/`)

The demo app validates real behavior by consuming the same exported library API that third-party projects use.

## Layer Map

```text
Host Demo Layer
  app/pages/index.vue
  app/components/* (adapters)
  app/composables/* (adapters)
  server/api/swagger.ts
  server/api/swagger-ui.ts
  resources/api-docs/api-docs.json

Reusable Library Layer
  lib/index.ts
  lib/types.ts
  lib/components/*
  lib/composables/*
  lib/styles/swagger-ui.css
```

## Data Flow

1. `SwaggerViewer` (library) loads schema via `useSwaggerSchema`.
2. In demo mode, source is `/api/swagger-ui` (`/api/swagger` kept as alias).
3. Server endpoint reads `resources/api-docs/api-docs.json`.
4. Library composables derive navigation and selected operation state.
5. Library components render endpoint, request/response, and schema views.

## Dependency Rules

- App layer may import from library layer.
- Library layer must not import from app layer.
- Server endpoint remains isolated from UI components.

## See Also

- [API Reference](api.md)
- [Configuration](configuration.md)
- [Deployment](deployment.md)
