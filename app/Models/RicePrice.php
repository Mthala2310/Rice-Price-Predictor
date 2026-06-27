<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RicePrice extends Model
{
    /** @use HasFactory<\Database\Factories\RicePriceFactory> */
    use HasFactory;

    protected $fillable = ['province_id', 'month', 'year', 'price'];

    public function province()
    {
        return $this->belongsTo(Province::class);
    }
}
