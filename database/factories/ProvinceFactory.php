<?php

namespace Database\Factories;

use App\Models\Province;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProvinceFactory extends Factory
{
    protected $model = Province::class;

    public function definition(): array
    {
        return [
            'province_name' => strtoupper(fake()->unique()->word()),
            'accuracy' => fake()->randomFloat(2, 95, 99),
        ];
    }
}
