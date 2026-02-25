[← Getting Started](getting-started.md) · [Back to README](../README.md) · [API Reference →](api.md)

# Architecture

## Overview

Repository is Laravel-package-first with internal frontend build tooling.

Layers:

1. Laravel runtime package (root): `composer.json`, `src/`, `routes/`, `config/`, `resources/views`, `resources/assets`
2. Viewer frontend source: `lib/` + `bridge-viewer/`
3. Demo host app (for local iteration only): `app/`, `server/`, `resources/api-docs`

## Dependency Rules

- Laravel runtime must not depend on Nuxt runtime.
- Vue/Nuxt source is build-time only for producing viewer assets.
- Demo app can import from `lib/`, but runtime package does not import from `app/`.

## Runtime Flow

1. Laravel route `/swagger-ui` renders Blade page.
2. Blade page loads offline assets from `/swagger-ui/assets/*`.
3. Viewer requests schema from `/api/swagger-ui`.
4. Schema resolver checks configured path, then l5-swagger, then storage fallback.

## Build Flow

1. `vite.viewer.config.ts` builds standalone viewer bundle.
2. `scripts/sync-bridge-viewer-assets.mjs` syncs bundle into `resources/assets`.
3. Composer package ships with prebuilt assets.

## See Also

- [API Reference](api.md)
- [Configuration](configuration.md)
- [Deployment](deployment.md)
