[← Architecture](architecture.md) · [Back to README](../README.md) · [Configuration →](configuration.md)

# API Reference

## Internal Server Endpoint

### `GET /api/swagger`

Returns OpenAPI JSON from local file `resources/api-docs/api-docs.json`.

#### Success Response

- `200` with parsed JSON payload.

#### Error Cases

- Missing schema file -> `404` + message `Expected schema file at resources/api-docs/api-docs.json`.
- Invalid schema JSON -> `500` + message `Schema file is not valid JSON`.

Logging:

- Missing file logs `WARN` in `server/api/swagger.ts`.
- Parse failure logs `ERROR` in `server/api/swagger.ts`.

## Client-Side API Surface

### `useOpenApiSchema()` (`app/composables/useOpenApiSchema.ts`)

Returns:

- `schema`: reactive OpenAPI document (`IApiSpec | null`).
- `isLoading`: loading state.
- `loadError`: typed load error (`missing_source`, `invalid_schema`, `fetch_error`).
- `defaultSchemaEndpoint`: default endpoint (`/api/swagger`).
- `loadSchema(source?)`: loads schema and normalizes errors.

### `useSwaggerNavigation()` (`app/composables/useSwaggerNavigation.ts`)

Returns:

- `endpointNavigation`: grouped endpoint navigation by first tag.
- `schemaNavigation`: schemas navigation derived from `components.schemas`.

### `useSelectedOperation()` (`app/composables/useSelectedOperation.ts`)

Returns:

- `selectedItem`: current endpoint/schema selection.
- `onSelect(item)`: updates selection.
- `getMethodConfig(operationId)`
- `getParameters(operationId)`
- `getRequestBodySchema(operationId)`
- `getSecurity(operationId)`

### `generateExampleFromSchema()` (`app/composables/schemaExample.ts`)

Generates example values from OpenAPI schema nodes, including:

- `$ref` resolution via `components.schemas`
- `allOf` / `oneOf` / `anyOf` handling
- primitives and nested objects/arrays

## See Also

- [Architecture](architecture.md) - where API logic sits in layers.
- [Getting Started](getting-started.md) - local schema setup.
- [Configuration](configuration.md) - runtime config defaults.
