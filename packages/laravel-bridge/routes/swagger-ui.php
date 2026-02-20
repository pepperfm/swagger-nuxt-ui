<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Pepperfm\SwaggerUiBridge\Http\Controllers\SwaggerSchemaController;

$routePath = (string) config('swagger-ui-bridge.route.path', '/api/swagger-ui');
$routeName = (string) config('swagger-ui-bridge.route.name', 'swagger-ui.bridge.schema');
$routeMiddleware = config('swagger-ui-bridge.route.middleware', ['web']);
$middleware = is_array($routeMiddleware) ? $routeMiddleware : ['web'];

if (trim($routePath) === '') {
    Log::warning('[swagger-ui-bridge] Route path is empty, skipping route registration');

    return;
}

$router = app('router');
if ($router->getRoutes()->getByName($routeName) !== null) {
    Log::warning('[swagger-ui-bridge] Route name already exists, skipping route registration', [
        'name' => $routeName,
    ]);

    return;
}

$normalizedUri = ltrim($routePath, '/');
foreach ($router->getRoutes() as $existingRoute) {
    if (!in_array('GET', $existingRoute->methods(), true)) {
        continue;
    }
    if ($existingRoute->uri() !== $normalizedUri) {
        continue;
    }

    Log::warning('[swagger-ui-bridge] GET route path already exists, skipping route registration', [
        'path' => $routePath,
    ]);

    return;
}

Route::middleware($middleware)
    ->get($routePath, SwaggerSchemaController::class)
    ->name($routeName);
