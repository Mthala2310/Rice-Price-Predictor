<?php

namespace Tests\Feature;

use App\Models\Province;
use App\Models\RicePrice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class HistoricalDataTest extends TestCase
{
    use RefreshDatabase;

    private Province $province;

    protected function setUp(): void
    {
        parent::setUp();
        $this->province = Province::factory()->create(['province_name' => 'ACEH', 'accuracy' => 96]);
        RicePrice::factory()->create(['province_id' => $this->province->id, 'year' => 2020, 'month' => 1, 'price' => 10000]);
        RicePrice::factory()->create(['province_id' => $this->province->id, 'year' => 2020, 'month' => 6, 'price' => 11000]);
        RicePrice::factory()->create(['province_id' => $this->province->id, 'year' => 2025, 'month' => 12, 'price' => 15000]);
        RicePrice::factory()->create(['province_id' => $this->province->id, 'year' => 2026, 'month' => 1, 'price' => 16000]);
    }

    #[Test]
    public function returns_most_recent_records_when_no_year_filter()
    {
        $response = $this->getJson('/api/historical?province=ACEH&limit=3');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(3, $data);
        $years = array_column($data, 'year');
        $this->assertEquals([2020, 2025, 2026], $years);
        // Most recent 3 records: 2020-06, 2025-12, 2026-01 → reversed to ASC
    }

    #[Test]
    public function filters_by_year_when_provided()
    {
        $response = $this->getJson('/api/historical?province=ACEH&year=2020');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(2, $data);
        foreach ($data as $row) {
            $this->assertEquals(2020, $row['year']);
        }
    }

    #[Test]
    public function returns_empty_when_no_data_for_year()
    {
        $response = $this->getJson('/api/historical?province=ACEH&year=2030');

        $response->assertOk();
        $this->assertEmpty($response->json('data'));
    }

    #[Test]
    public function returns_404_for_unknown_province()
    {
        $response = $this->getJson('/api/historical?province=UNKNOWN');
        $response->assertNotFound();
    }

    #[Test]
    public function filters_by_date_range()
    {
        $response = $this->getJson('/api/historical?province=ACEH&start_year=2019&end_year=2020');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(2, $data);
        $years = array_column($data, 'year');
        $this->assertEquals([2020, 2020], $years);
    }

    #[Test]
    public function filters_by_date_range_with_months()
    {
        $response = $this->getJson('/api/historical?province=ACEH&start_year=2025&start_month=6&end_year=2026&end_month=6');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(2, $data);
        $years = array_column($data, 'year');
        $this->assertEquals([2025, 2026], $years);
    }

    #[Test]
    public function returns_empty_when_range_has_no_data()
    {
        $response = $this->getJson('/api/historical?province=ACEH&start_year=2030&end_year=2035');

        $response->assertOk();
        $this->assertEmpty($response->json('data'));
    }
}
