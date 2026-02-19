[← Architecture](architecture.md) · [Back to README](../README.md) · [Configuration →](configuration.md)

# API Reference

## Internal Server Endpoint

### `GET /api/swagger`

Fetches and returns remote Swagger/OpenAPI JSON.

#### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `url` | string | Yes | Absolute URL to OpenAPI JSON |

#### Success Response

- Returns upstream JSON payload unchanged.

#### Error Cases

- Missing `url` -> `{ "error": "No url provided" }`.
- Upstream fetch failure -> surfaced to client as a loading error in `useOpenApiSchema`.

## Client-Side API Surface

### `useOpenApiSchema()` (`app/composables/useOpenApiSchema.ts`)

Returns:

- `schema`: reactive OpenAPI document.
- `isLoading`: loading state.
- `loadError`: string message for UI feedback.
- `loadSchema(url: string)`: performs fetch via `/api/swagger` and updates state.

### `generateExampleFromSchema()` (`app/composables/schemaExample.ts`)

Generates example values from OpenAPI schema nodes, including:

- `$ref` resolution via `components.schemas`
- `allOf` / `oneOf` / `anyOf` handling
- primitives (`string`, `number`, `boolean`, etc.)
- nested objects and arrays

## See Also

- [Architecture](architecture.md) - where API logic sits in layers.
- [Getting Started](getting-started.md) - how to run and use endpoint flow.
- [Configuration](configuration.md) - runtime config defaults.
