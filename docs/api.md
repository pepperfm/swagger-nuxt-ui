[← Architecture](architecture.md) · [Back to README](../README.md) · [Configuration →](configuration.md)

# API Reference

## Server Endpoints (Demo + Bridge)

### `GET /api/swagger`

Reads and returns JSON from `resources/api-docs/api-docs.json`.

Responses:

- `200`: parsed OpenAPI JSON
- `404`: schema file missing
- `500`: invalid JSON in schema file

Logs:

- `WARN`: missing schema file
- `ERROR`: JSON parse failure

### `GET /api/swagger-ui` (Laravel bridge contract)

Returns OpenAPI JSON for Laravel consumers.

Schema source resolution priority:

1. `config('swagger-ui-bridge.schema_path')` when explicitly configured.
2. `l5-swagger` generated docs path from Laravel config (if available).
3. Fallback `storage/api-docs/api-docs.json`.

Responses:

- `200`: parsed OpenAPI JSON
- `404`: schema file missing for all resolution candidates
- `422`: schema file exists but contains invalid JSON

Error body contract:

```json
{
  "message": "OpenAPI schema file not found",
  "code": "schema_file_not_found"
}
```

```json
{
  "message": "OpenAPI schema JSON is invalid",
  "code": "schema_json_invalid"
}
```

### `GET /swagger-ui` (Laravel bridge viewer page contract)

Returns standalone HTML page with embedded Swagger viewer UI.

Runtime behavior:

- Viewer frontend bootstraps from local bridge assets (no CDN).
- Default schema source is `GET /api/swagger-ui`.
- Viewer keeps working offline when assets are published in the bridge package.

Responses:

- `200`: HTML viewer page rendered.
- `404`: route is not registered (disabled or conflicting route already exists in host app).
- `500`: bridge viewer asset is missing/unreadable (critical render failure).

Logs:

- `WARN`: viewer route disabled or skipped due to route name/path conflict.
- `ERROR`: critical render failure (for example missing asset file).

## Library Exports

Entry: `@pepperfm/swagger-nuxt-ui`

- `SwaggerViewer`
- `ContentNavigation`
- `RequestParametersList`
- `RequestBodyCard`
- `ResponseExampleCard`
- `SchemaDetailCard`
- `useSwaggerSchema`
- `useSwaggerNavigation`
- `useSelectedOperation`
- `generateExampleFromSchema`
- `createSwaggerUiPlugin`
- OpenAPI types from `lib/types.ts`

Styles entry:

- `@pepperfm/swagger-nuxt-ui/styles.css`

## `SwaggerViewer` Component Contract

Props:

- `schemaSource?: string` (default `/api/swagger-ui`)
- `baseApiUrl?: string`
- `schemaHeadline?: string`
- `titleFallback?: string`
- `descriptionFallback?: string`

Events:

- `schema-error` (`SwaggerSchemaLoadError`)
- `schema-loaded` (`IApiSpec`)

## Composable Contract Highlights

### `useSwaggerSchema(strategy?)`

- Supports local endpoint and explicit URL source input.
- Exposes `schema`, `isLoading`, `loadError`, `loadSchema`, `defaultSource`.

### `useSwaggerNavigation(schemaRef)`

- Builds endpoint groups and schema navigation nodes.
- Logs `WARN` on unsupported/invalid operation records.

### `useSelectedOperation({ schema, endpointNavigation })`

- Maintains selected endpoint/schema item.
- Resolves request params, security, and request body schema.

## See Also

- [Getting Started](getting-started.md)
- [Configuration](configuration.md)
