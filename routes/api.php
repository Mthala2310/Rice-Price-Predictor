<?php

use App\Http\Controllers\Api\PredictionController;
use Illuminate\Support\Facades\Route;

Route::get('/provinces', [PredictionController::class, 'provinces']);
Route::get('/dashboard', [PredictionController::class, 'dashboard']);
Route::post('/predict', [PredictionController::class, 'predict']);
Route::get('/historical', [PredictionController::class, 'historicalData']);
Route::get('/all-prices', [PredictionController::class, 'allPrices']);


