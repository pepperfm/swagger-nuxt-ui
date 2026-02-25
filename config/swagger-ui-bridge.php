<?php

declare(strict_types=1);

$resolveMiddleware = static function (string $value, string $fallback = 'web'): array {
    $middleware = array_values(array_filter(array_map('trim', explode(',', (string) env($value, $fallback)))));

    return $middleware === [] ? ['web'] : $middleware;
};

return [
    'enabled' => env('SWAGGER_UI_BRIDGE_ENABLED', true),
    'schema_path' => env('SWAGGER_UI_BRIDGE_SCHEMA_PATH'),
    'route' => [
        'path' => env('SWAGGER_UI_BRIDGE_ROUTE_PATH', '/api/swagger-ui'),
        'name' => env('SWAGGER_UI_BRIDGE_ROUTE_NAME', 'swagger-ui.bridge.schema'),
        'middleware' => $resolveMiddleware('SWAGGER_UI_BRIDGE_ROUTE_MIDDLEWARE'),
    ],
    'viewer' => [
        'enabled' => env('SWAGGER_UI_BRIDGE_VIEWER_ENABLED', true),
        'title' => env('SWAGGER_UI_BRIDGE_VIEWER_TITLE', 'API Documentation'),
        'route' => [
            'path' => env('SWAGGER_UI_BRIDGE_VIEWER_ROUTE_PATH', '/swagger-ui'),
            'name' => env('SWAGGER_UI_BRIDGE_VIEWER_ROUTE_NAME', 'swagger-ui.bridge.viewer'),
            'middleware' => $resolveMiddleware('SWAGGER_UI_BRIDGE_VIEWER_MIDDLEWARE'),
        ],
    ],
];
