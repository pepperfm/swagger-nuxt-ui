<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>{{ $title }}</title>
    <link rel="stylesheet" href="{{ $viewerCssUrl }}">
</head>
<body>
<div id="swagger-ui-bridge-viewer" class="isolate"></div>
<script>
window.__SWAGGER_UI_BRIDGE__ = {{ \Illuminate\Support\Js::from([
    'schemaSource' => $schemaSource,
    'schemaHeadline' => $schemaHeadline,
    'baseApiUrl' => $baseApiUrl,
]) }};
</script>
<script type="module" src="{{ $viewerJsUrl }}"></script>
</body>
</html>
