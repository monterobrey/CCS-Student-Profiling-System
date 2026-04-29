<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Named 'login' route required by Laravel's mail notification layout.
// Redirects to the frontend login page since this is an API-only backend.
Route::get('/login', function () {
    return redirect(rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/') . '/login');
})->name('login');
