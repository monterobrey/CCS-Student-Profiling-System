<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Handle preflight OPTIONS
        if ($request->isMethod('OPTIONS')) {
            return response('', 200, $this->headers);
        }

        $response = $next($request);

        foreach ($this->headers as $key => $value) {
            $response->header($key, $value);
        }

        return $response;
    }

    private $headers = [
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers' => 'Authorization, Content-Type, X-Requested-With, Accept',
        'Access-Control-Max-Age' => '86400',
    ];
}