[← Configuration](configuration.md) · [Back to README](../README.md) · [Contributing →](contributing.md)

# Deployment

## Demo App Deployment

Build and preview:

```bash
bun run build:app
bun run preview
```

Existing workflow: `.github/workflows/deploy.yml` deploys demo app over SSH.

## Library + Bridge Release Flow

Release workflow: `.github/workflows/release.yml`

Pipeline stages:

1. Install dependencies
2. Run lint/typecheck
3. Build library (`bun run build:lib`)
4. Build standalone viewer + sync bridge assets (`bun run build:bridge-assets`)
5. Verify artifacts for library and bridge viewer
6. Upload build artifacts
7. Publish package on `release.published` (if `NPM_TOKEN` is configured)

## Recommended Checks Before Release

```bash
bun run lint
bun run typecheck
bun run build:app
bun run build:lib
bun run build:bridge-assets
```

## Laravel Bridge Smoke Checklist (Acceptance Gate)

### 1) Laravel + `darkaonline/l5-swagger`

- Install npm package and run `bunx swagger-ui-bridge-install`.
- Generate docs: `php artisan l5-swagger:generate`.
- Verify `GET /api/swagger-ui` returns `200` JSON.
- Verify `GET /swagger-ui` renders viewer page.
- Expected diagnostics: no `ERROR`; possible `WARN` only on route conflict.

### 2) Laravel without `l5-swagger` (fallback file)

- Ensure `storage/api-docs/api-docs.json` exists.
- Run `bunx swagger-ui-bridge-install`.
- Verify `GET /api/swagger-ui` returns `200` JSON from fallback file.
- Verify `GET /swagger-ui` renders viewer page.
- If fallback file is missing, expect `404` with `code: schema_file_not_found` and bridge `ERROR` log.

### 3) Local path-repo bridge install

- Run:
  `bunx swagger-ui-bridge-install --path /abs/path/to/packages/laravel-bridge --constraint @dev`
- Verify `composer.json` contains path repository for bridge package.
- Verify viewer opens at `/swagger-ui` and loads local assets.
- Expected diagnostics: actionable `WARN/ERROR` if path invalid, constraint rejected, or package name mismatch.

## See Also

- [Configuration](configuration.md)
- [API Reference](api.md)
