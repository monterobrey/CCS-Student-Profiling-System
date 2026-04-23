<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'https://ccs-student-profiling-system.vercel.app',
        'https://ccs-student-profiling-system-git-f214fd-obrey-monters-projects.vercel.app',
        'http://localhost:3000',
    ],

    'allowed_origins_patterns' => [
        '#^https://ccs-student-profiling-system.*\.vercel\.app$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
