[Back to README](../README.md) · [Architecture →](architecture.md)

# Getting Started

## Prerequisites

- PHP 8.2+
- Laravel 10/11/12
- Composer
- Node.js 20+ and `bun` (only for package development/building viewer assets)

## Consumer Install (Laravel)

```bash
composer require pepperfm/swagger-nuxt-ui-for-laravel
```

Then open:

- `GET /swagger-ui`
- `GET /api/swagger-ui`

If using `darkaonline/l5-swagger`, regenerate schema when needed:

```bash
php artisan l5-swagger:generate
```

## Optional Config Publish

```bash
php artisan vendor:publish --tag=swagger-ui-bridge-config
```

## Local Package Development

```bash
bun install
bun run build:bridge-assets
```

This updates runtime assets in `resources/assets`.

## Migration from Legacy Flow

Old flow:

- `bun add @pepper_fm/swagger-nuxt-ui`
- `bunx swagger-ui-bridge-install`

New canonical flow:

- `composer require pepperfm/swagger-nuxt-ui-for-laravel`

Legacy `swagger-ui-bridge-install` is now deprecated and only prints guidance.
Compatibility note: root package declares `replace` for `pepperfm/swagger-ui-laravel-bridge`.

## See Also

- [API Reference](api.md)
- [Configuration](configuration.md)
- [Deployment](deployment.md)
