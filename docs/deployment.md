[← Configuration](configuration.md) · [Back to README](../README.md) · [Contributing →](contributing.md)

# Deployment

## Build and Preview

```bash
pnpm build
pnpm preview
```

## Existing GitHub Deployment Workflow

Current repository contains `.github/workflows/deploy.yml` that triggers on pushes to `master` and deploys over SSH to a VPS.

## Recommended Release Checks

Run before deploying:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Container Deployment

This repository now includes Docker artifacts:

- `Dockerfile` (multi-stage dev/prod)
- `compose.yml`
- `compose.override.yml`
- `compose.production.yml`

Use these for containerized dev/prod workflows.

## See Also

- [Configuration](configuration.md) - runtime variables and defaults.
- [Contributing](contributing.md) - quality gates for changes.
- [Getting Started](getting-started.md) - local development setup.
