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
  A web application for monitoring, analyzing, and predicting rice prices across 31 provinces in Indonesia using machine learning.
</p>

---

## Screenshots

| Dashboard | Prediction | Comparison |
|---|---|---|
| *(add screenshot)* | *(add screenshot)* | *(add screenshot)* |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Laravel 12, PHP 8.2+, MySQL |
| **Frontend** | React 18, TypeScript, Inertia.js, Tailwind CSS |
| **ML Service** | FastAPI, scikit-learn (Linear Regression) |
| **Tooling** | Vite, Recharts, Axios, Ziggy, Laravel Breeze |

---

## Features

- **Real-time Dashboard** — summary of rice prices and ML predictions across 8 main provinces
- **Price Prediction** — predict future rice prices using Linear Regression via FastAPI
- **Multi-province Comparison** — compare price trends between up to 3 provinces on the same chart
- **Custom Date Range** — flexible analysis with configurable start/end month and year
- **Historical Trends** — view up to 10 years of historical price data (2016–2026)
- **Auto-training** — ML models are automatically trained from the latest price data
- **Responsive UI** — dark-themed interface with glassmorphism design

---

## Architecture

```
┌──────────┐     ┌─────────────────┐     ┌──────────────┐
│  Browser │────▶│  Laravel 12     │────▶│  MySQL       │
│ (React)  │     │  (API + SSR)    │     │  (historical)│
└──────────┘     └────────┬────────┘     └──────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  FastAPI     │
                   │  (ML Model)  │
                   └──────────────┘
```

- **Laravel** serves the frontend via Inertia.js (React) and provides REST API endpoints
- **FastAPI** runs scikit-learn Linear Regression models for price prediction
- **MySQL** stores historical rice price data and user sessions

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
└── tests/
    └── Feature/
        └── HistoricalDataTest.php              # API integration tests
```

---

## License

This project is open-sourced under the [MIT license](https://opensource.org/licenses/MIT).
