<?php

namespace Database\Seeders;

use App\Models\Province;
use App\Models\RicePrice;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class RicePriceSeeder extends Seeder
{
    public function run(): void
    {
        $csvPath = database_path('..' . DIRECTORY_SEPARATOR . 'dataset_lengkap.csv');

        if (!file_exists($csvPath)) {
            $this->command->error("CSV file not found at: $csvPath");
            return;
        }

        $handle = fopen($csvPath, 'r');
        $header = fgetcsv($handle);

        $provinces = Province::pluck('id', 'province_name');

        $batch = [];
        $count = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $date = $row[0];
            $provinceName = strtoupper(trim($row[1]));
            $price = (float) $row[7];

            if (!isset($provinces[$provinceName])) {
                continue;
            }

            $parsed = date_parse_from_format('Y-m-d', $date);
            $month = $parsed['month'];
            $year = $parsed['year'];

            $batch[] = [
                'province_id' => $provinces[$provinceName],
                'month' => $month,
                'year' => $year,
                'price' => $price,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $count++;

            if (count($batch) >= 500) {
                RicePrice::insert($batch);
                $batch = [];
            }
        }

        if (!empty($batch)) {
            RicePrice::insert($batch);
        }

        fclose($handle);
        $this->command->info("Imported $count rice price records.");
    }
}
