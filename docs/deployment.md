[← Configuration](configuration.md) · [Back to README](../README.md) · [Contributing →](contributing.md)

# Deployment

## Demo App Deployment

Build and preview:

```bash
pnpm run build:app
pnpm preview
```

Existing workflow: `.github/workflows/deploy.yml` deploys demo app over SSH.

## Library Release Flow

Release workflow: `.github/workflows/release.yml`

Pipeline stages:

1. Install dependencies
2. Run lint/typecheck
3. Build library (`pnpm run build:lib`)
4. Verify artifacts (`index.mjs`, `index.cjs`, `types.d.ts`, `index.css`)
5. Upload build artifact
6. Publish package on `release.published` event (if `NPM_TOKEN` is configured)

## Recommended Checks Before Release

```bash
bun run lint
bun run typecheck
bun run build:app
bun run build:lib
```

## Laravel Bridge Smoke Checklist

Validate install behavior in three host scenarios:

1. Laravel + `darkaonline/l5-swagger` + composer available
- Install package normally.
- Verify route exists: `php artisan route:list | grep swagger-ui`.
- Verify response: `GET /api/swagger-ui` returns `200` JSON schema.

2. Laravel without `l5-swagger`
- Ensure fallback file exists: `storage/api-docs/api-docs.json`.
- Verify `GET /api/swagger-ui` returns `200`.
- If missing file, endpoint returns `404` with code `schema_file_not_found`.

3. Non-Laravel host
- Install package in plain Vue/Nuxt project.
- Ensure install is not blocked by bridge bootstrap attempts.
- Set `SWAGGER_UI_SKIP_LARAVEL_BRIDGE=1` when forcing skip in CI.

## See Also

- [Configuration](configuration.md)
- [API Reference](api.md)
