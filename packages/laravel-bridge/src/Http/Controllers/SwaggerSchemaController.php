<?php

declare(strict_types=1);

namespace Pepperfm\SwaggerUiBridge\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use JsonException;
use Pepperfm\SwaggerUiBridge\SchemaPathResolver;

final class SwaggerSchemaController
{
    public function __invoke(SchemaPathResolver $resolver): JsonResponse
    {
        $schemaPath = $resolver->resolve();
        if (!is_string($schemaPath)) {
            return response()->json([
                'message' => 'OpenAPI schema file not found',
                'code' => 'schema_file_not_found',
            ], 404);
        }

        $schemaContents = @file_get_contents($schemaPath);
        if ($schemaContents === false) {
            Log::error('[swagger-ui-bridge] Failed to read schema file', [
                'path' => $schemaPath,
            ]);

            return response()->json([
                'message' => 'OpenAPI schema file not found',
                'code' => 'schema_file_not_found',
            ], 404);
        }

        try {
            $payload = json_decode($schemaContents, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            Log::error('[swagger-ui-bridge] Schema JSON is invalid', [
                'path' => $schemaPath,
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'OpenAPI schema JSON is invalid',
                'code' => 'schema_json_invalid',
            ], 422);
        }

        return response()->json($payload)->header('Cache-Control', 'no-store, private');
    }
}
