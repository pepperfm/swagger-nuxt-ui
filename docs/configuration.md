[← API Reference](api.md) · [Back to README](../README.md) · [Deployment →](deployment.md)

# Configuration

## Runtime Configuration (`nuxt.config.ts`)

Public runtime settings:

| Key | Env Variable | Default |
|-----|--------------|---------|
| `runtimeConfig.public.apiHost` | `NUXT_BASE_API_HOST` | `http://localhost` |
| `runtimeConfig.public.apiUrl` | `NUXT_BASE_API_URL` | `http://localhost/api` |

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

## See Also

- [Deployment](deployment.md) - production and container runtime settings.
- [Architecture](architecture.md) - config impact on layers.
- [Contributing](contributing.md) - validation commands before merge.
