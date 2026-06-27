<?php

namespace Database\Factories;

use App\Models\RicePrice;
use Illuminate\Database\Eloquent\Factories\Factory;

class RicePriceFactory extends Factory
{
    protected $model = RicePrice::class;

    public function definition(): array
    {
        return [
            'province_id' => ProvinceFactory::new(),
            'month' => fake()->numberBetween(1, 12),
            'year' => fake()->numberBetween(2016, 2026),
            'price' => fake()->randomFloat(2, 8000, 20000),
        ];
    }
}
