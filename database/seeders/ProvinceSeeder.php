<?php

namespace Database\Seeders;

use App\Models\Province;
use Illuminate\Database\Seeder;

class ProvinceSeeder extends Seeder
{
    public function run(): void
    {
        $provinces = [
            ['province_name' => 'ACEH', 'accuracy' => 96.99],
            ['province_name' => 'BALI', 'accuracy' => 98.10],
            ['province_name' => 'BANTEN', 'accuracy' => 97.77],
            ['province_name' => 'GORONTALO', 'accuracy' => 98.50],
            ['province_name' => 'JAMBI', 'accuracy' => 99.32],
            ['province_name' => 'JAWA BARAT', 'accuracy' => 97.86],
            ['province_name' => 'JAWA TENGAH', 'accuracy' => 99.04],
            ['province_name' => 'JAWA TIMUR', 'accuracy' => 98.79],
            ['province_name' => 'KALIMANTAN BARAT', 'accuracy' => 98.58],
            ['province_name' => 'KALIMANTAN SELATAN', 'accuracy' => 96.50],
            ['province_name' => 'KALIMANTAN TENGAH', 'accuracy' => 97.50],
            ['province_name' => 'KALIMANTAN TIMUR', 'accuracy' => 97.80],
            ['province_name' => 'KALIMANTAN UTARA', 'accuracy' => 97.00],
            ['province_name' => 'KEPULAUAN BANGKA BELITUNG', 'accuracy' => 98.00],
            ['province_name' => 'KEPULAUAN RIAU', 'accuracy' => 97.50],
            ['province_name' => 'LAMPUNG', 'accuracy' => 98.20],
            ['province_name' => 'MALUKU', 'accuracy' => 96.80],
            ['province_name' => 'MALUKU UTARA', 'accuracy' => 97.10],
            ['province_name' => 'NUSA TENGGARA BARAT', 'accuracy' => 97.60],
            ['province_name' => 'NUSA TENGGARA TIMUR', 'accuracy' => 96.90],
            ['province_name' => 'PAPUA', 'accuracy' => 95.50],
            ['province_name' => 'PAPUA BARAT', 'accuracy' => 96.00],
            ['province_name' => 'RIAU', 'accuracy' => 98.70],
            ['province_name' => 'SULAWESI BARAT', 'accuracy' => 97.30],
            ['province_name' => 'SULAWESI SELATAN', 'accuracy' => 98.40],
            ['province_name' => 'SULAWESI TENGAH', 'accuracy' => 97.80],
            ['province_name' => 'SULAWESI TENGGARA', 'accuracy' => 97.50],
            ['province_name' => 'SULAWESI UTARA', 'accuracy' => 98.10],
            ['province_name' => 'SUMATERA BARAT', 'accuracy' => 98.30],
            ['province_name' => 'SUMATERA SELATAN', 'accuracy' => 98.50],
            ['province_name' => 'SUMATERA UTARA', 'accuracy' => 98.20],
        ];

        foreach ($provinces as $province) {
            Province::create($province);
        }
    }
}
