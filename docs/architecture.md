[← Getting Started](getting-started.md) · [Back to README](../README.md) · [API Reference →](api.md)

# Architecture

## Overview

The project follows a lightweight layered structure tailored to Nuxt:

- `app/pages` and `app/components`: presentation layer.
- `app/composables`: application logic and state orchestration.
- `server/api`: infrastructure boundary for remote schema fetching.
- `app/types`: shared OpenAPI contracts.

## Directory Map

```text
app/
  pages/index.vue
  components/*
  composables/useOpenApiSchema.ts
  composables/schemaExample.ts
  types/types.d.ts
server/
  api/swagger.ts
```

## Dependency Rules

- Pages can consume components, composables, and shared types.
- Components should stay presentation-focused and avoid direct remote fetch logic.
- Composables encapsulate schema transformation and fetch state.
- Server API handlers stay isolated from client-only UI code.

## Data Flow

1. User provides Swagger URL and Base API URL.
2. `useOpenApiSchema` calls `/api/swagger?url=<encoded-url>`.
3. `server/api/swagger.ts` fetches and returns remote JSON.
4. `index.vue` derives grouped navigation and selected endpoint details.
5. UI cards render request/response/schema information.

## See Also

- [API Reference](api.md) - endpoint contracts and behavior.
- [Configuration](configuration.md) - runtime defaults and env vars.
- [Deployment](deployment.md) - build and runtime execution modes.
