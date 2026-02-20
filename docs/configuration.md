[← API Reference](api.md) · [Back to README](../README.md) · [Deployment →](deployment.md)

# Configuration

## Demo Runtime Config (`nuxt.config.ts`)

| Key | Env Variable | Default |
|-----|--------------|---------|
| `runtimeConfig.public.apiHost` | `NUXT_BASE_API_HOST` | `http://localhost` |
| `runtimeConfig.public.apiUrl` | `NUXT_BASE_API_URL` | `http://localhost/api` |

`apiUrl` is used for copied full endpoint links inside viewer UI.

## Library Build Config

- `vite.lib.config.ts`: library bundle config (ESM + CJS)
- `tsconfig.lib.json`: declaration generation for public API
- Entry point: `lib/index.ts`
- CSS output: `dist/lib/index.css`

## Scripts

- `dev:app`: run Nuxt demo app
- `build:app`: build Nuxt demo app
- `build:lib`: build distributable library bundle and declarations

## Schema Source Strategy

`useSwaggerSchema` supports:

- default local source (`/api/swagger-ui`)
- explicit override source via `loadSchema(source)`
- custom `fetcher` injection

## Laravel Bridge Config

Bridge package config key: `swagger-ui-bridge`.

Defaults:

- `enabled: true`
- `route.path: /api/swagger-ui`
- `route.name: swagger-ui.bridge.schema`
- `route.middleware: ['web']`
- `schema_path: null` (auto resolve through `l5-swagger` then fallback to `storage/api-docs/api-docs.json`)

## Logging Policy

- `WARN`: invalid schema shape, unsupported method records, missing refs/sources
- `ERROR`: schema fetch failures and unrecoverable parse failures

## See Also

- [API Reference](api.md)
- [Deployment](deployment.md)
