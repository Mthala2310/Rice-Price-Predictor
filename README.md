<p align="center">
  <img src="https://img.shields.io/badge/Laravel-12-FF2D20?logo=laravel&logoColor=white" alt="Laravel 12">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React 18">
  <img src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/scikit--learn-F7931E?logo=scikitlearn&logoColor=white" alt="scikit-learn">
</p>

<h1 align="center">Rice Price Predictor</h1>

<p align="center">
  <b>Machine Learning-based rice price forecasting system</b> — trains Linear Regression models per province to predict future rice prices across all 31 provinces of Indonesia.
</p>



---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Laravel 12, PHP 8.2+, MySQL |
| **Frontend** | React 18, TypeScript, Inertia.js, Tailwind CSS |
| **ML Service** | FastAPI, scikit-learn (Linear Regression), joblib |
| **ML Pipeline** | Dataset CSV → Model Training → Serialized .pkl → Prediction API |
| **Tooling** | Vite, Recharts, Axios, Ziggy, Laravel Breeze |

---

## Features

- **ML Price Prediction** — predict future rice prices using per-province Linear Regression models served via FastAPI
- **31 Province Models** — each province has its own trained model (stored as `.pkl`), enabling localized predictions
- **Real-time Dashboard** — summary of latest prices and prediction accuracy across all 31 provinces
- **Multi-province Comparison** — overlay predicted vs historical price trends for up to 3 provinces
- **Custom Date Range** — flexible analysis with configurable start/end month and year
- **Historical Trends (2016–2026)** — over 3,000 data points covering a decade of rice prices
- **Auto-training** — models are automatically retrained from the latest dataset when predictions are requested
- **Responsive UI** — dark-themed glassmorphism interface optimized for desktop & mobile

---

## Architecture

```
┌──────────┐     ┌─────────────────┐     ┌──────────────┐
│  Browser │────▶│  Laravel 12     │────▶│  MySQL       │
│ (React)  │     │  (API + SSR)    │     │  (historical)│
└──────────┘     └────────┬────────┘     └──────────────┘
                          │
                          │  POST /predict {province, month, year}
                          ▼
                   ┌──────────────────┐
                   │  FastAPI         │
                   │  (ML Service)    │
                   │                  │
                   │  ┌────────────┐  │
                   │  │ model_*.pkl │  │  ← 31 Linear Regression models
                   │  └────────────┘  │       trained on {month, year} → price
                   └──────────────────┘
```

### How ML Prediction Works

1. **Dataset** — historical rice prices stored in `dataset_lengkap.csv` and seeded into MySQL
2. **Training** — FastAPI trains a separate Linear Regression model per province using `month` and `year` as features to predict `price`
3. **Serialization** — each trained model is saved as `model_<province>.pkl` in `fastapi-service/models/`
4. **Prediction** — when a user requests a forecast, FastAPI loads the corresponding `.pkl` model and runs inference
5. **Fallback** — if no model exists, FastAPI automatically trains one from the latest database records

- **Laravel** serves the frontend via Inertia.js (React), provides REST API endpoints, and stores historical data
- **FastAPI** runs the scikit-learn Linear Regression inference pipeline
- **MySQL** holds ~3,000 historical price records (2016–2026) across 31 provinces

---

## Dataset

The model is trained on **`dataset_lengkap.csv`** containing rice price records from January 2016 to December 2024 for all 31 Indonesian provinces. Each record includes:

| Column | Description |
|---|---|
| `year` | Year of observation |
| `month` | Month of observation (1–12) |
| `province` | Province name |
| `price` | Rice price in IDR |

> The dataset is split per province, so each model learns from ~36 data points (monthly, 2016–2024). Features: `[month, year]` → Target: `price`.

---

## Prerequisites

- PHP 8.2+
- Composer
- Node.js & npm
- Python 3.9+
- MySQL

---

## Setup

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/rice-price-predictor.git
cd rice-price-predictor

# PHP dependencies
composer install

# JavaScript dependencies
npm install

# Python dependencies
pip install -r fastapi-service/requirements.txt
```

### 2. Environment

```bash
cp .env.example .env
# Edit .env — set DB_DATABASE, DB_USERNAME, DB_PASSWORD to match your MySQL
```

### 3. Database

```bash
# Create MySQL database named 'rice_price_predictor'

php artisan key:generate
php artisan migrate --seed
```

### 4. Run (4 Terminals)

```bash
# Terminal 1 — Laravel Backend
php artisan serve --port=8001

# Terminal 2 — Queue Worker
php artisan queue:listen --tries=1

# Terminal 3 — Frontend (Vite)
npm run dev

# Terminal 4 — FastAPI ML Service
cd fastapi-service
python main.py
```

Open **http://localhost:8001** in your browser. Register an account to get started.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/provinces` | List all provinces |
| GET | `/api/historical` | Get historical prices (supports `year`, `start_year`, `end_year`, `start_month`, `end_month`) |
| POST | `/api/predict` | Predict price for a province, month, and year |
| GET | `/api/dashboard` | Get dashboard summary data |
| GET | `/api/all-prices` | Get all prices (used for model training) |

---

## Testing

```bash
php artisan test
```

The test suite includes integration tests for the historical data API endpoint, covering year filtering, date range filtering, empty responses, and 404 handling.

---

## Project Structure

```
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/
│   │   │   │   └── PredictionController.php    # ML prediction & data endpoints
│   │   │   └── Auth/                           # Authentication controllers
│   │   └── Middleware/
│   │       └── HandleInertiaRequests.php       # Inertia shared props
│   └── Models/
│       ├── Province.php
│       ├── RicePrice.php
│       └── User.php
├── database/
│   ├── factories/                              # Model factories for testing
│   ├── migrations/                             # DB schema
│   └── seeders/                                # Province & price data seeders
├── fastapi-service/
│   ├── main.py                                 # FastAPI prediction server
│   ├── models/                                 # Trained .pkl models (31 provinces)
│   └── requirements.txt
├── resources/js/
│   ├── Pages/
│   │   ├── Dashboard.tsx                       # Dashboard overview
│   │   ├── Prediction.tsx                      # Single province prediction
│   │   ├── Comparison.tsx                      # Multi-province comparison
│   │   └── Auth/                               # Login, Register, etc.
│   └── Layouts/
│       ├── AuthenticatedLayout.tsx             # Sidebar + nav layout
│       └── GuestLayout.tsx
├── routes/
│   ├── web.php                                 # Web routes (Inertia pages)
│   ├── api.php                                 # API routes
│   └── auth.php                                # Auth routes
├── docs/
│   ├── prd.md                                 # Product Requirement Document
│   └── notebooks/
│       └── predik_linear.ipynb                # Jupyter notebook — ML exploration & prototyping
├── dataset_lengkap.csv                        # Raw dataset (source of truth for training)
└── tests/
    └── Feature/
        └── HistoricalDataTest.php              # API integration tests
```

---

## License

This project is open-sourced under the [MIT license](https://opensource.org/licenses/MIT).
