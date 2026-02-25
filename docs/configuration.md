[← API Reference](api.md) · [Back to README](../README.md) · [Deployment →](deployment.md)

# Configuration

## Demo Runtime Config (`nuxt.config.ts`)

| Key | Env Variable | Default |
|-----|--------------|---------|
| `runtimeConfig.public.apiHost` | `NUXT_BASE_API_HOST` | `http://localhost` |
| `runtimeConfig.public.apiUrl` | `NUXT_BASE_API_URL` | `http://localhost/api` |

`apiUrl` is used for copied full endpoint links inside viewer UI.

## Viewer Runtime Options (`SwaggerViewer`)

| Prop | Default | Description |
|------|---------|-------------|
| `schemaSource` | `/api/swagger-ui` | OpenAPI JSON endpoint |
| `baseApiUrl` | `''` | Prefix for request URL/copy links |
| `schemaHeadline` | `./resources/api-docs/api-docs.json` | Headline label over title |
| `enableRequestEmulator` | `true` | Enables right-sidebar endpoint request card |
| `requestTimeoutMs` | `0` | Browser request timeout in ms (`0` disables timeout) |

Request emulator behavior:

- Endpoint selection: right sidebar shows request builder + send action.
- Schema selection: right sidebar shows schema example panel.
- Request execution is browser-side (`fetch`) and depends on API CORS policy.

## Library Build Config

- `vite.lib.config.ts`: library bundle config (ESM + CJS)
- `tsconfig.lib.json`: declaration generation for public API
- `vite.viewer.config.ts`: standalone viewer bundle config
- `tsconfig.viewer.json`: viewer entrypoint typing

## Scripts

- `dev:app`: run Nuxt demo app
- `build:app`: build Nuxt demo app
- `build:lib`: build distributable library bundle and declarations
- `build:viewer`: build standalone viewer assets (`dist/viewer`)
- `build:bridge-assets`: copy `viewer.js/css` into bridge package
- `bridge:install`: run Laravel bridge bootstrap locally

## Laravel Bridge Config

Bridge package config key: `swagger-ui-bridge`.

### JSON Route

- `enabled: true`
- `route.path: /api/swagger-ui`
- `route.name: swagger-ui.bridge.schema`
- `route.middleware: ['web']`
- `schema_path: null`

Schema resolution order:

1. `schema_path`
2. `l5-swagger` docs path
3. `storage/api-docs/api-docs.json`

### Viewer Route

- `viewer.enabled: true`
- `viewer.title: API Documentation`
- `viewer.route.path: /swagger-ui`
- `viewer.route.name: swagger-ui.bridge.viewer`
- `viewer.route.middleware: ['web']`

The viewer page renders a full Nuxt UI layout:

- **UHeader** with the configured `viewer.title` and a dark/light mode toggle
- **UMain** wrapping the SwaggerViewer component (sidebar + content)
- **UFooter** with copyright and a second color mode toggle

The `viewer.title` value flows through to the page `<title>` tag and the header text.

Viewer assets are served from bridge package route:

- `GET <viewer.route.path>/assets/viewer.css`
- `GET <viewer.route.path>/assets/viewer.js`

## Installer Configuration

CLI: `swagger-ui-bridge-install`

Options:

- `--project-root`
- `--package`
- `--path`
- `--constraint`
- `--strict`

Environment variables:

- `SWAGGER_UI_SKIP_LARAVEL_BRIDGE=1`
- `SWAGGER_UI_BRIDGE_STRICT=1`
- `SWAGGER_UI_BRIDGE_PACKAGE=vendor/package`
- `SWAGGER_UI_BRIDGE_PATH=/abs/path/to/packages/l5-swagger-ui-bridge`
- `SWAGGER_UI_BRIDGE_CONSTRAINT=@dev`

## Logging Policy

- `WARN`: route conflicts, viewer-disabled config, recoverable schema issues
- `ERROR`: schema parse/read failures, missing critical viewer asset files

## See Also

- [API Reference](api.md)
- [Deployment](deployment.md)
