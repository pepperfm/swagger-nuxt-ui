<?php

declare(strict_types=1);

namespace Pepperfm\SwaggerUiBridge;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Log;

class SwaggerUiBridgeServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../config/swagger-ui-bridge.php', 'swagger-ui-bridge');
    }

    public function boot(): void
    {
        $this->loadViewsFrom(__DIR__ . '/../resources/views', 'swagger-ui-bridge');

        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__ . '/../config/swagger-ui-bridge.php' => config_path('swagger-ui-bridge.php'),
            ], 'swagger-ui-bridge-config');

            $this->publishes([
                __DIR__ . '/../resources/views' => resource_path('views/vendor/swagger-ui-bridge'),
            ], 'swagger-ui-bridge-views');
        }

        if (!(bool) config('swagger-ui-bridge.enabled', true)) {
            Log::warning('[swagger-ui-bridge] Route registration is disabled by configuration');

            return;
        }

        $this->loadRoutesFrom(__DIR__ . '/../routes/swagger-ui.php');
    }
}
