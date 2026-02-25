<?php

declare(strict_types=1);

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Pepperfm\SwaggerUiBridge\Http\Controllers\BridgeAssetController;
use Pepperfm\SwaggerUiBridge\Http\Controllers\SwaggerSchemaController;
use Pepperfm\SwaggerUiBridge\Http\Controllers\SwaggerViewerPageController;

$router = app('router');

/**
 * @param array<int, mixed>|null $routeMiddleware
 */
$registerGetRoute = static function (
    string $type,
    string $routePath,
    string $routeName,
    ?array $routeMiddleware,
    mixed $handler
) use ($router): bool {
    $normalizedPath = trim($routePath);
    if ($normalizedPath === '') {
        Log::warning('[swagger-ui-bridge] Route path is empty, skipping route registration', [
            'type' => $type,
            'name' => $routeName,
        ]);

        return false;
    }
    if (!str_starts_with($normalizedPath, '/')) {
        Log::warning('[swagger-ui-bridge] Route path does not start with slash, normalizing', [
            'type' => $type,
            'path' => $normalizedPath,
        ]);
        $normalizedPath = '/' . ltrim($normalizedPath, '/');
    }

    if ($router->getRoutes()->getByName($routeName) !== null) {
        Log::warning('[swagger-ui-bridge] Route name already exists, skipping route registration', [
            'type' => $type,
            'name' => $routeName,
        ]);

        return false;
    }

    $normalizedUri = ltrim($normalizedPath, '/');
    foreach ($router->getRoutes() as $existingRoute) {
        if (!in_array('GET', $existingRoute->methods(), true)) {
            continue;
        }
        if ($existingRoute->uri() !== $normalizedUri) {
            continue;
        }

        Log::warning('[swagger-ui-bridge] GET route path already exists, skipping route registration', [
            'type' => $type,
            'path' => $normalizedPath,
        ]);

        return false;
    }

    $middleware = Arr::where(
        array_map(static fn ($item): string => trim((string) $item), $routeMiddleware ?? ['web']),
        static fn (string $item): bool => $item !== '',
    );
    if ($middleware === []) {
        $middleware = ['web'];
    }

    Route::middleware(array_values($middleware))
        ->get($normalizedPath, $handler)
        ->name($routeName);

    return true;
};

$schemaRouteMiddleware = config('swagger-ui-bridge.route.middleware', ['web']);
$registerGetRoute(
    'schema',
    (string) config('swagger-ui-bridge.route.path', '/api/swagger-ui'),
    (string) config('swagger-ui-bridge.route.name', 'swagger-ui.bridge.schema'),
    is_array($schemaRouteMiddleware) ? $schemaRouteMiddleware : ['web'],
    SwaggerSchemaController::class,
);

$viewerEnabled = (bool) config('swagger-ui-bridge.viewer.enabled', true);
if (!$viewerEnabled) {
    Log::warning('[swagger-ui-bridge] Viewer route is disabled by configuration');

    return;
}

$viewerRoutePath = (string) config('swagger-ui-bridge.viewer.route.path', '/swagger-ui');
$viewerRouteMiddleware = config('swagger-ui-bridge.viewer.route.middleware', ['web']);
$viewerRegistered = $registerGetRoute(
    'viewer',
    $viewerRoutePath,
    (string) config('swagger-ui-bridge.viewer.route.name', 'swagger-ui.bridge.viewer'),
    is_array($viewerRouteMiddleware) ? $viewerRouteMiddleware : ['web'],
    SwaggerViewerPageController::class,
);
if (!$viewerRegistered) {
    Log::warning('[swagger-ui-bridge] Viewer route was not registered, skipping viewer asset route registration');

    return;
}

$normalizedViewerPrefix = '/' . trim($viewerRoutePath, '/');
if ($normalizedViewerPrefix === '/') {
    $normalizedViewerPrefix = '';
}
$registerGetRoute(
    'viewer-asset',
    $normalizedViewerPrefix . '/assets/{asset}',
    'swagger-ui.bridge.viewer.asset',
    is_array($viewerRouteMiddleware) ? $viewerRouteMiddleware : ['web'],
    BridgeAssetController::class,
);
