<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Handle preflight OPTIONS request directly
        if ($request->isMethod('OPTIONS')) {
            return response('', 200, $this->getCorsHeaders($request));
        }

        $response = $next($request);

        // Add CORS headers to response
        foreach ($this->getCorsHeaders($request) as $key => $value) {
            $response->header($key, $value);
        }

        return $response;
    }

    private function getCorsHeaders(Request $request): array
    {
        $origin = $request->headers->get('Origin');

        return [
            'Access-Control-Allow-Origin' => $origin ?: '*',
            'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers' => 'Authorization, Content-Type, X-Requested-With, Accept',
            'Access-Control-Allow-Credentials' => 'true',
            'Access-Control-Max-Age' => '86400',
        ];
    }
}