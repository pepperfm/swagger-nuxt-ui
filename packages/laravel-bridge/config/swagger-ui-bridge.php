<?php

declare(strict_types=1);

$routeMiddleware = array_values(array_filter(array_map('trim', explode(',', (string) env('SWAGGER_UI_BRIDGE_ROUTE_MIDDLEWARE', 'web')))));

return [
    'enabled' => env('SWAGGER_UI_BRIDGE_ENABLED', true),
    'schema_path' => env('SWAGGER_UI_BRIDGE_SCHEMA_PATH'),
    'route' => [
        'path' => env('SWAGGER_UI_BRIDGE_ROUTE_PATH', '/api/swagger-ui'),
        'name' => env('SWAGGER_UI_BRIDGE_ROUTE_NAME', 'swagger-ui.bridge.schema'),
        'middleware' => $routeMiddleware === [] ? ['web'] : $routeMiddleware,
    ],
];
