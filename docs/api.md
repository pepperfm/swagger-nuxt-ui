[← Architecture](architecture.md) · [Back to README](../README.md) · [Configuration →](configuration.md)

# API Reference

## Laravel Routes

### `GET /api/swagger-ui`

Returns OpenAPI schema JSON.

Resolution priority:

1. `config('swagger-ui-bridge.schema_path')`
2. `l5-swagger` configured docs file
3. `storage/api-docs/api-docs.json`

Responses:

- `200` parsed JSON
- `404` schema file not found
- `422` schema JSON invalid

Error body examples:

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

### `GET /swagger-ui`

Returns standalone viewer HTML page using offline package assets.

### `GET /swagger-ui/assets/{asset}`

Serves `viewer.js` and `viewer.css` only.

## Route Registration Behavior

Route registration is skipped (with WARN log) when:

- route name already exists
- GET path already exists
- route path is empty/invalid

## Internal Viewer Build Contract

- entrypoint: `bridge-viewer/main.ts`
- output: `dist/viewer/viewer.js`, `dist/viewer/viewer.css`
- synced runtime assets: `resources/assets/*`

## See Also

- [Getting Started](getting-started.md)
- [Configuration](configuration.md)
