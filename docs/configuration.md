[← API Reference](api.md) · [Back to README](../README.md) · [Deployment →](deployment.md)

# Configuration

## Laravel Config Key

Config file: `config/swagger-ui-bridge.php`

```php
return [
    'enabled' => true,
    'schema_path' => null,
    'route' => [
        'path' => '/api/swagger-ui',
        'name' => 'swagger-ui.bridge.schema',
        'middleware' => ['web'],
    ],
    'viewer' => [
        'enabled' => true,
        'title' => 'API Documentation',
        'route' => [
            'path' => '/swagger-ui',
            'name' => 'swagger-ui.bridge.viewer',
            'middleware' => ['web'],
        ],
    ],
];
```

## Environment Variables

- `SWAGGER_UI_BRIDGE_ENABLED`
- `SWAGGER_UI_BRIDGE_SCHEMA_PATH`
- `SWAGGER_UI_BRIDGE_ROUTE_PATH`
- `SWAGGER_UI_BRIDGE_ROUTE_NAME`
- `SWAGGER_UI_BRIDGE_ROUTE_MIDDLEWARE`
- `SWAGGER_UI_BRIDGE_VIEWER_ENABLED`
- `SWAGGER_UI_BRIDGE_VIEWER_TITLE`
- `SWAGGER_UI_BRIDGE_VIEWER_ROUTE_PATH`
- `SWAGGER_UI_BRIDGE_VIEWER_ROUTE_NAME`
- `SWAGGER_UI_BRIDGE_VIEWER_MIDDLEWARE`

## Schema Resolution Order

1. `schema_path`
2. `l5-swagger` docs path
3. `storage/api-docs/api-docs.json`

## Viewer Assets

Assets are bundled and served offline from package routes:

- `GET <viewer.route.path>/assets/viewer.css`
- `GET <viewer.route.path>/assets/viewer.js`

Source of truth in repository: `resources/assets/viewer.css` and `resources/assets/viewer.js`.

## Dev Build Scripts

- `bun run build:viewer` -> `dist/viewer/*`
- `bun run build:bridge-assets` -> `dist/viewer/*` + sync to `resources/assets/*`

## Logging Policy

- `WARN`: recoverable route conflicts/fallback resolution
- `ERROR`: unreadable schema/assets, invalid JSON

## See Also

- [API Reference](api.md)
- [Deployment](deployment.md)
