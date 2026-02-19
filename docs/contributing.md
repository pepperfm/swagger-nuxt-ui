[← Deployment](deployment.md) · [Back to README](../README.md)

# Contributing

## Branch and Commit Hygiene

- Keep changes focused and atomic.
- Use descriptive commit messages (Conventional Commits preferred).
- Avoid mixing refactors with behavior changes unless required.

## Local Validation Checklist

```bash
pnpm lint
pnpm typecheck
pnpm build
```

If Docker workflow is used:

```bash
make docker-build
make docker-up
```

## Code Style

- Follow ESLint rules from `eslint.config.mjs`.
- Keep UI logic reusable; extract complex logic into composables.
- Preserve Nuxt conventions for pages/components/composables.

## Pull Request Expectations

- Explain user-visible impact.
- Include screenshots for UI changes.
- Mention any config/env additions.

## See Also

- [Architecture](architecture.md) - dependency and module boundaries.
- [Deployment](deployment.md) - release process and container workflows.
- [API Reference](api.md) - endpoint and composable contracts.
