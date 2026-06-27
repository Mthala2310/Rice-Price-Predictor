<?php

use App\Http\Controllers\Admin\DataController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/prediction', function () {
    return Inertia::render('Prediction');
})->middleware(['auth', 'verified'])->name('prediction');

Route::get('/comparison', function () {
    return Inertia::render('Comparison');
})->middleware(['auth', 'verified'])->name('comparison');

Route::get('/admin/data', function () {
    return Inertia::render('Admin/DataManagement');
})->middleware(['auth', 'verified'])->name('admin.data');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware('auth')->prefix('api/admin/data')->group(function () {
    Route::get('/', [DataController::class, 'index']);
    Route::post('/', [DataController::class, 'store']);
    Route::put('/{id}', [DataController::class, 'update']);
    Route::delete('/{id}', [DataController::class, 'destroy']);
    Route::post('/import', [DataController::class, 'importCsv']);
    Route::get('/template', [DataController::class, 'downloadTemplate']);
});

require __DIR__.'/auth.php';
