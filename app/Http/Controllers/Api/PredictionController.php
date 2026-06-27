<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Province;
use App\Models\RicePrice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class PredictionController extends Controller
{
    protected string $fastApiUrl = 'http://127.0.0.1:8000';

    public function provinces()
    {
        return Province::orderBy('province_name')->get(['id', 'province_name', 'accuracy']);
    }

    public function predict(Request $request)
    {
        $request->validate([
            'province' => 'required|string',
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2016',
        ]);

        $province = Province::where('province_name', strtoupper($request->province))->firstOrFail();
        $month = (int) $request->month;
        $year = (int) $request->year;

        $isFuture = ($year > date('Y')) || ($year == date('Y') && $month > date('n'));

        if (!$isFuture) {
            $price = RicePrice::where('province_id', $province->id)
                ->where('month', $month)
                ->where('year', $year)
                ->first();

            if ($price) {
                return response()->json([
                    'province' => $province->province_name,
                    'month' => $month,
                    'year' => $year,
                    'predicted_price' => (float) $price->price,
                    'accuracy' => (float) $province->accuracy,
                    'source' => 'historical',
                ]);
            }
        }

        try {
            $response = Http::timeout(30)->post("{$this->fastApiUrl}/predict", [
                'province' => $province->province_name,
                'month' => $month,
                'year' => $year,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return response()->json([
                    'province' => $province->province_name,
                    'month' => $month,
                    'year' => $year,
                    'predicted_price' => (float) $data['predicted_price'],
                    'accuracy' => (float) ($data['accuracy'] ?? $province->accuracy),
                    'source' => 'prediction',
                ]);
            }

            return response()->json(['error' => 'Prediction service unavailable'], 502);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Prediction service unavailable', 'message' => $e->getMessage()], 502);
        }
    }

    public function historicalData(Request $request)
    {
        $request->validate([
            'province' => 'required|string',
            'limit' => 'integer|min:1|max:120',
            'year' => 'integer|min:2016|nullable',
            'start_year' => 'integer|min:2016|nullable',
            'start_month' => 'integer|between:1,12|nullable',
            'end_year' => 'integer|min:2016|nullable',
            'end_month' => 'integer|between:1,12|nullable',
        ]);

        $province = Province::where('province_name', strtoupper($request->province))->firstOrFail();
        $limit = $request->input('limit', 24);

        $query = RicePrice::where('province_id', $province->id);

        if ($request->filled('start_year') && $request->filled('end_year')) {
            $startYear = (int) $request->start_year;
            $startMonth = $request->filled('start_month') ? (int) $request->start_month : 1;
            $endYear = (int) $request->end_year;
            $endMonth = $request->filled('end_month') ? (int) $request->end_month : 12;

            $query->where(function ($q) use ($startYear, $startMonth, $endYear, $endMonth) {
                $q->where(function ($sub) use ($startYear, $startMonth) {
                    $sub->where('year', '>', $startYear)
                        ->orWhere(function ($sub2) use ($startYear, $startMonth) {
                            $sub2->where('year', $startYear)
                                ->where('month', '>=', $startMonth);
                        });
                });
                $q->where(function ($sub) use ($endYear, $endMonth) {
                    $sub->where('year', '<', $endYear)
                        ->orWhere(function ($sub2) use ($endYear, $endMonth) {
                            $sub2->where('year', $endYear)
                                ->where('month', '<=', $endMonth);
                        });
                });
            });

            $limit = 120;
        } elseif ($request->filled('year')) {
            $query->where('year', $request->year);
        }

        $hasRange = $request->filled('start_year');
        $hasYear = $request->filled('year');

        $ordered = $query
            ->orderBy('year', $hasRange || $hasYear ? 'asc' : 'desc')
            ->orderBy('month', $hasRange || $hasYear ? 'asc' : 'desc')
            ->limit($limit)
            ->get(['month', 'year', 'price']);

        if (!$hasRange && !$hasYear) {
            $ordered = $ordered->reverse()->values();
        }

        return response()->json([
            'province' => $province->province_name,
            'data' => $ordered,
        ]);
    }

    public function allPrices()
    {
        $provinces = Province::orderBy('province_name')->get();
        $result = [];

        foreach ($provinces as $province) {
            $prices = RicePrice::where('province_id', $province->id)
                ->orderBy('year')
                ->orderBy('month')
                ->get(['month', 'year', 'price']);

            $result[] = [
                'province' => $province->province_name,
                'accuracy' => (float) $province->accuracy,
                'prices' => $prices->map(fn($p) => [
                    'month' => $p->month,
                    'year' => $p->year,
                    'price' => (float) $p->price,
                ]),
            ];
        }

        return response()->json($result);
    }

    public function dashboard()
    {
        $provinces = Province::orderBy('province_name')->get();
        $cards = [];

        foreach ($provinces as $province) {
            $latestPrice = RicePrice::where('province_id', $province->id)
                ->orderBy('year', 'desc')
                ->orderBy('month', 'desc')
                ->first();

            $displayPrice = $latestPrice ? (float) $latestPrice->price : null;
            $displayMonth = $latestPrice?->month;
            $displayYear = $latestPrice?->year;
            $displayAccuracy = (float) $province->accuracy;
            $source = 'historical';

            $prevPrice = RicePrice::where('province_id', $province->id)
                ->where(function ($q) use ($latestPrice) {
                    $q->where('year', $latestPrice?->year)
                        ->where('month', '<', $latestPrice?->month)
                        ->orWhere('year', '<', $latestPrice?->year);
                })
                ->orderBy('year', 'desc')
                ->orderBy('month', 'desc')
                ->first();

            $change = null;
            if ($prevPrice && $prevPrice->price > 0 && $displayPrice) {
                $change = round((($displayPrice - $prevPrice->price) / $prevPrice->price) * 100, 2);
            }

            $cards[] = [
                'id' => $province->id,
                'province_name' => $province->province_name,
                'latest_price' => $displayPrice,
                'latest_month' => $displayMonth,
                'latest_year' => $displayYear,
                'change_percent' => $change,
                'accuracy' => $displayAccuracy,
                'source' => $source,
            ];
        }

        return response()->json([
            'cards' => $cards,
            'all_provinces' => $cards,
        ]);
    }
}
