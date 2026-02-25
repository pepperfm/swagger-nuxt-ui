<?php

declare(strict_types=1);

namespace Pepperfm\SwaggerUiBridge\Http\Controllers;

use Illuminate\Contracts\View\View;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

final class SwaggerViewerPageController
{
    public function __invoke(): View
    {
        $schemaPath = (string) config('swagger-ui-bridge.route.path', '/api/swagger-ui');
        $schemaRouteName = (string) config('swagger-ui-bridge.route.name', 'swagger-ui.bridge.schema');

        $schemaSource = $schemaPath;
        if (Route::has($schemaRouteName)) {
            $schemaSource = route($schemaRouteName);
        }

        $viewerPath = (string) config('swagger-ui-bridge.viewer.route.path', '/swagger-ui');
        $viewerPrefix = '/' . trim($viewerPath, '/');
        if ($viewerPrefix === '/') {
            $viewerPrefix = '';
        }

        $assetRouteName = 'swagger-ui.bridge.viewer.asset';
        if (Route::has($assetRouteName)) {
            $viewerCssUrl = route($assetRouteName, ['asset' => 'viewer.css']);
            $viewerJsUrl = route($assetRouteName, ['asset' => 'viewer.js']);
        } else {
            Log::warning('[swagger-ui-bridge] Viewer asset route is unavailable, using fallback asset paths');
            $viewerCssUrl = $viewerPrefix . '/assets/viewer.css';
            $viewerJsUrl = $viewerPrefix . '/assets/viewer.js';
        }

        return view('swagger-ui-bridge::viewer', [
            'title' => (string) config('swagger-ui-bridge.viewer.title', 'API Documentation'),
            'schemaSource' => $schemaSource,
            'schemaHeadline' => './storage/api-docs/api-docs.json',
            'baseApiUrl' => '',
            'viewerCssUrl' => $viewerCssUrl,
            'viewerJsUrl' => $viewerJsUrl,
        ]);
    }
}
