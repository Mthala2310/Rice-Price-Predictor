<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Province;
use App\Models\RicePrice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class DataController extends Controller
{
    public function index()
    {
        $provinces = Province::orderBy('province_name')->get(['id', 'province_name']);
        $prices = RicePrice::with('province')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(50);

        return response()->json([
            'provinces' => $provinces,
            'prices' => $prices,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'province_id' => 'required|exists:provinces,id',
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2016',
            'price' => 'required|numeric|min:0',
        ]);

        $price = RicePrice::updateOrCreate(
            [
                'province_id' => $validated['province_id'],
                'month' => $validated['month'],
                'year' => $validated['year'],
            ],
            ['price' => $validated['price']]
        );

        $this->triggerTraining();

        return response()->json(['message' => 'Data saved', 'data' => $price]);
    }

    public function update(Request $request, $id)
    {
        $price = RicePrice::findOrFail($id);

        $validated = $request->validate([
            'province_id' => 'required|exists:provinces,id',
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2016',
            'price' => 'required|numeric|min:0',
        ]);

        $price->update($validated);

        $this->triggerTraining();

        return response()->json(['message' => 'Data updated', 'data' => $price]);
    }

    public function destroy($id)
    {
        $price = RicePrice::findOrFail($id);
        $price->delete();

        $this->triggerTraining();

        return response()->json(['message' => 'Data deleted']);
    }

    public function importCsv(Request $request)
    {
        $request->validate([
            'csv' => 'required|file|mimes:csv,txt|max:10240',
        ]);

        $file = $request->file('csv');
        $handle = fopen($file->path(), 'r');
        $header = fgetcsv($handle);

        $provinces = Province::pluck('id', 'province_name');
        $count = 0;
        $errors = [];

        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) < 8) {
                continue;
            }

            $date = $row[0];
            $provinceName = strtoupper(trim($row[1]));
            $price = (float) $row[7];

            if (!isset($provinces[$provinceName])) {
                $errors[] = "Unknown province: $provinceName";
                continue;
            }

            $parsed = date_parse_from_format('Y-m-d', $date);
            if ($parsed['error_count'] > 0) {
                $errors[] = "Invalid date: $date";
                continue;
            }

            RicePrice::updateOrCreate(
                [
                    'province_id' => $provinces[$provinceName],
                    'month' => $parsed['month'],
                    'year' => $parsed['year'],
                ],
                ['price' => $price]
            );

            $count++;
        }

        fclose($handle);

        if ($count > 0) {
            try {
                Http::timeout(120)->post('http://127.0.0.1:8000/train');
            } catch (\Exception $e) {
                // training failure is non-critical
            }
        }

        return response()->json([
            'message' => "Imported $count records",
            'count' => $count,
            'errors' => $errors,
        ]);
    }

    private function triggerTraining(): void
    {
        try {
            Http::timeout(120)->post('http://127.0.0.1:8000/train');
        } catch (\Exception $e) {
            // non-critical
        }
    }

    public function downloadTemplate()
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="import_template.csv"',
        ];

        $callback = function () {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['date', 'admin1', 'commodity', 'unit', 'priceflag', 'pricetype', 'currency', 'price']);
            fputcsv($handle, ['2026-01-15', 'ACEH', 'Rice', 'KG', 'aggregate', 'Retail', 'IDR', '12000']);
            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
