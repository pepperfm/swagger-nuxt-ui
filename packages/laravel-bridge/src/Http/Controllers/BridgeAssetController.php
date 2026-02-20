<?php

declare(strict_types=1);

namespace Pepperfm\SwaggerUiBridge\Http\Controllers;

use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

final class BridgeAssetController
{
    public function __invoke(string $asset): Response
    {
        $allowedAssets = ['viewer.js', 'viewer.css'];
        if (!in_array($asset, $allowedAssets, true)) {
            abort(404);
        }

        $assetPath = dirname(__DIR__, 3) . '/resources/assets/' . $asset;
        if (!is_file($assetPath) || !is_readable($assetPath)) {
            Log::error('[swagger-ui-bridge] Viewer asset file is missing or unreadable', [
                'asset' => $asset,
                'path' => $assetPath,
            ]);

            return response('Viewer asset unavailable', 500, [
                'Content-Type' => 'text/plain; charset=UTF-8',
            ]);
        }

        $contents = @file_get_contents($assetPath);
        if ($contents === false) {
            Log::error('[swagger-ui-bridge] Failed to read viewer asset file', [
                'asset' => $asset,
                'path' => $assetPath,
            ]);

            return response('Viewer asset unavailable', 500, [
                'Content-Type' => 'text/plain; charset=UTF-8',
            ]);
        }

        $contentType = str_ends_with($asset, '.css')
            ? 'text/css; charset=UTF-8'
            : 'application/javascript; charset=UTF-8';

        return response($contents, 200, [
            'Content-Type' => $contentType,
            'Cache-Control' => 'public, max-age=3600',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
