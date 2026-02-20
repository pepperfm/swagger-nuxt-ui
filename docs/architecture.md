[← Getting Started](getting-started.md) · [Back to README](../README.md) · [API Reference →](api.md)

# Architecture

## Overview

The project follows a lightweight layered structure tailored to Nuxt:

- `app/pages` and `app/components`: presentation layer.
- `app/composables`: application logic and state orchestration.
- `server/api`: infrastructure boundary for local schema file IO.
- `app/types`: shared OpenAPI contracts.

## Directory Map

```text
app/
  pages/index.vue
  components/*
  composables/useOpenApiSchema.ts
  composables/useSwaggerNavigation.ts
  composables/useSelectedOperation.ts
  composables/schemaExample.ts
  types/types.d.ts
server/
  api/swagger.ts
resources/
  api-docs/api-docs.json
```

## Dependency Rules

- Pages can consume components, composables, and shared types.
- Components should stay presentation-focused and avoid direct fetch/file logic.
- Composables encapsulate schema transformation and selection state.
- Server API handlers stay isolated from client-only UI code.

## Data Flow

1. App startup triggers `useOpenApiSchema.loadSchema()` with default `/api/swagger`.
2. `server/api/swagger.ts` reads `resources/api-docs/api-docs.json` and returns parsed JSON.
3. `useSwaggerNavigation` derives grouped endpoint/schema navigation.
4. `useSelectedOperation` manages current selection and derived operation details.
5. UI cards render request/response/schema information.

## See Also

- [API Reference](api.md) - endpoint contracts and composable behavior.
- [Configuration](configuration.md) - runtime defaults and env vars.
- [Deployment](deployment.md) - build and runtime execution modes.
