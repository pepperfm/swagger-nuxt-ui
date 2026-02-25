<?php

declare(strict_types=1);

namespace Pepperfm\SwaggerUiBridge;

use Illuminate\Support\Facades\Log;

final class SchemaPathResolver
{
    public function resolve(): ?string
    {
        $configuredPath = $this->normalizePath(config('swagger-ui-bridge.schema_path'));
        if (is_string($configuredPath)) {
            if ($this->isReadableFile($configuredPath)) {
                return $configuredPath;
            }

            Log::warning('[swagger-ui-bridge] Configured schema_path is not readable', [
                'path' => $configuredPath,
            ]);
        }

        $l5SwaggerPath = $this->resolveL5SwaggerSchemaPath();
        if (is_string($l5SwaggerPath)) {
            if ($this->isReadableFile($l5SwaggerPath)) {
                return $l5SwaggerPath;
            }

            Log::warning('[swagger-ui-bridge] l5-swagger schema path is not readable', [
                'path' => $l5SwaggerPath,
            ]);
        }

        $fallbackPath = storage_path('api-docs/api-docs.json');
        if ($this->isReadableFile($fallbackPath)) {
            Log::warning('[swagger-ui-bridge] Using fallback schema path', [
                'path' => $fallbackPath,
            ]);

            return $fallbackPath;
        }

        Log::error('[swagger-ui-bridge] Unable to resolve schema path', [
            'checked_paths' => array_values(array_filter([$configuredPath, $l5SwaggerPath, $fallbackPath])),
        ]);

        return null;
    }

    private function resolveL5SwaggerSchemaPath(): ?string
    {
        $l5SwaggerConfig = config('l5-swagger');
        if (!is_array($l5SwaggerConfig)) {
            return null;
        }

        $paths = $this->resolveL5SwaggerPaths($l5SwaggerConfig);
        if (!is_array($paths)) {
            return null;
        }

        $docsJson = $paths['docs_json'] ?? null;
        if (!is_string($docsJson) || trim($docsJson) === '') {
            return null;
        }
        if ($this->isAbsolutePath($docsJson)) {
            return $docsJson;
        }

        $docsPath = $paths['docs'] ?? null;
        if (is_string($docsPath) && trim($docsPath) !== '') {
            return rtrim($docsPath, '/\\') . DIRECTORY_SEPARATOR . ltrim($docsJson, '/\\');
        }

        return null;
    }

    /**
     * @param array<string, mixed> $l5SwaggerConfig
     * @return array<string, mixed>|null
     */
    private function resolveL5SwaggerPaths(array $l5SwaggerConfig): ?array
    {
        $defaultsPaths = $l5SwaggerConfig['defaults']['paths'] ?? null;
        $paths = is_array($defaultsPaths) ? $defaultsPaths : [];

        $documentations = $l5SwaggerConfig['documentations'] ?? null;
        $defaultDocumentation = $l5SwaggerConfig['default'] ?? null;

        if (!is_array($documentations)) {
            return $paths;
        }

        $activeDocumentation = null;
        if (is_string($defaultDocumentation) && isset($documentations[$defaultDocumentation]) && is_array($documentations[$defaultDocumentation])) {
            $activeDocumentation = $documentations[$defaultDocumentation];
        }
        if (!is_array($activeDocumentation)) {
            foreach ($documentations as $documentation) {
                if (is_array($documentation)) {
                    $activeDocumentation = $documentation;
                    break;
                }
            }
        }
        if (!is_array($activeDocumentation)) {
            return $paths;
        }

        $documentationPaths = $activeDocumentation['paths'] ?? null;
        if (is_array($documentationPaths)) {
            return array_merge($paths, $documentationPaths);
        }

        return $paths;
    }

    private function normalizePath(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $path = trim($value);

        return $path === '' ? null : $path;
    }

    private function isReadableFile(string $path): bool
    {
        return is_file($path) && is_readable($path);
    }

    private function isAbsolutePath(string $path): bool
    {
        if (str_starts_with($path, '/') || str_starts_with($path, '\\')) {
            return true;
        }

        return (bool) preg_match('/^[A-Za-z]:\\\\/', $path);
    }
}
