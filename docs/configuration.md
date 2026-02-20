[← API Reference](api.md) · [Back to README](../README.md) · [Deployment →](deployment.md)

# Configuration

## Runtime Configuration (`nuxt.config.ts`)

Public runtime settings:

| Key | Env Variable | Default | Purpose |
|-----|--------------|---------|---------|
| `runtimeConfig.public.apiHost` | `NUXT_BASE_API_HOST` | `http://localhost` | Host label used in UI/runtime context |
| `runtimeConfig.public.apiUrl` | `NUXT_BASE_API_URL` | `http://localhost/api` | Base URL used to build copied endpoint URLs |

## Schema Source Configuration

Schema source is fixed to local file mode:

- Client load endpoint: `GET /api/swagger`
- Local file path: `resources/api-docs/api-docs.json`

Remote schema URLs are not accepted anymore.

## Nuxt Modules

Configured modules:

- `@nuxt/eslint`
- `@nuxt/ui`

## UI and Route Rules

- Global stylesheet: `app/assets/css/main.css`
- Root route prerender: `routeRules['/'] = { prerender: true }`
- Compatibility date: `compatibilityDate = '2025-01-15'`

## Local Environment Files

- `.env` for local overrides
- `.env.example` as baseline template

## Logging Policy

Minimal logging is used:

- `WARN`: missing schema source/file or invalid operation records
- `ERROR`: terminal schema load/parse failures

## See Also

- [Deployment](deployment.md) - production and container runtime settings.
- [Architecture](architecture.md) - config impact on layers.
- [Contributing](contributing.md) - validation commands before merge.
