import os
import re
import joblib
import numpy as np
import pandas as pd
import requests as http_req
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Rice Price Predictor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

ACCURACY_MAP = {
    "ACEH": 96.99,
    "BALI": 98.10,
    "BANTEN": 97.77,
    "JAMBI": 99.32,
    "JAWA BARAT": 97.86,
    "JAWA TENGAH": 99.04,
    "JAWA TIMUR": 98.79,
    "KALIMANTAN BARAT": 98.58,
    "KALIMANTAN SELATAN": 98.10,
    "KALIMANTAN TENGAH": 97.37,
    "KALIMANTAN TIMUR": 98.82,
    "KALIMANTAN UTARA": 98.38,
    "KEPULAUAN RIAU": 98.68,
    "KEPULAUAN BANGKA BELITUNG": 99.00,
    "LAMPUNG": 98.86,
    "MALUKU": 98.97,
    "MALUKU UTARA": 99.28,
    "NUSA TENGGARA BARAT": 97.86,
    "NUSA TENGGARA TIMUR": 98.61,
    "PAPUA": 99.04,
    "PAPUA BARAT": 98.50,
    "RIAU": 98.88,
    "SULAWESI BARAT": 98.35,
    "SULAWESI SELATAN": 98.29,
    "SULAWESI TENGGARA": 97.30,
    "SULAWESI UTARA": 98.61,
    "SULAWESI TENGAH": 97.98,
    "SUMATERA BARAT": 98.21,
    "SUMATERA SELATAN": 98.27,
    "SUMATERA UTARA": 98.38,
    "GORONTALO": 97.25,
}

last_prices = {}


def load_data():
    csv_path = os.path.join(BASE_DIR, "..", "dataset_lengkap.csv")
    csv_path = os.path.normpath(csv_path)
    if not os.path.exists(csv_path):
        csv_path = os.path.join(BASE_DIR, "..", "..", "dataset_lengkap.csv")
        csv_path = os.path.normpath(csv_path)
    if not os.path.exists(csv_path):
        return
    df = pd.read_csv(csv_path)
    if str(df.iloc[0]["date"]).startswith("#"):
        df = df.iloc[1:].copy()
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df_rice = df[(df["commodity"] == "Rice") & (df["admin1"].notna())].copy()
    for province in df_rice["admin1"].unique():
        prov_data = df_rice[df_rice["admin1"] == province].copy()
        monthly = prov_data.groupby("date")["price"].mean()
        monthly = monthly.sort_index()
        if len(monthly) >= 2:
            last_prices[province.upper()] = {
                "lag_1": float(monthly.iloc[-1]),
                "lag_2": float(monthly.iloc[-2]),
            }


load_data()


class PredictRequest(BaseModel):
    province: str
    month: int
    year: int
    lag_1: Optional[float] = None
    lag_2: Optional[float] = None


class PredictResponse(BaseModel):
    province: str
    month: int
    year: int
    predicted_price: float
    accuracy: float


def province_to_model_file(province: str) -> str:
    name = province.lower().replace(" ", "_")
    name = re.sub(r"[^a-z_]", "", name)
    return os.path.join(MODELS_DIR, f"model_rice_{name}.pkl")


def load_model(province: str):
    path = province_to_model_file(province)
    if not os.path.exists(path):
        raise HTTPException(
            status_code=404, detail=f"No model found for province: {province}"
        )
    return joblib.load(path)


def get_available_provinces():
    provinces = []
    pattern = re.compile(r"^model_rice_(.+)\.pkl$")
    for f in os.listdir(MODELS_DIR):
        m = pattern.match(f)
        if m:
            name = m.group(1).replace("_", " ").upper()
            provinces.append(name)
    return sorted(provinces)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/models")
def list_models():
    provinces = get_available_provinces()
    return {"provinces": provinces, "count": len(provinces)}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    province = req.province.upper()
    model = load_model(province)

    lag_1 = req.lag_1
    lag_2 = req.lag_2

    if lag_1 is None or lag_2 is None:
        if province in last_prices:
            if lag_1 is None:
                lag_1 = last_prices[province]["lag_1"]
            if lag_2 is None:
                lag_2 = last_prices[province]["lag_2"]
        else:
            raise HTTPException(
                status_code=400,
                detail=f"No historical data for lag values. Provide lag_1 and lag_2 in request.",
            )

    X = np.array([[lag_1, lag_2, req.month, req.year]], dtype=float)
    pred = model.predict(X)[0]
    accuracy = ACCURACY_MAP.get(province, 96.00)

    return PredictResponse(
        province=province,
        month=req.month,
        year=req.year,
        predicted_price=round(float(pred), 2),
        accuracy=round(float(accuracy), 2),
    )


@app.post("/train")
def train():
    LARAVEL_URL = "http://127.0.0.1:8001/api/all-prices"
    try:
        resp = http_req.get(LARAVEL_URL, timeout=60)
        resp.raise_for_status()
        provinces_data = resp.json()
    except Exception as e:
        raise HTTPException(
            status_code=502, detail=f"Failed to fetch training data: {e}"
        )

    results = []
    global ACCURACY_MAP, last_prices
    new_accuracy = {}
    new_last_prices = {}

    for entry in provinces_data:
        province = entry["province"]
        prices = entry["prices"]
        if len(prices) < 3:
            new_accuracy[province] = entry.get("accuracy", 96.0)
            continue

        df = pd.DataFrame(prices)
        df = df.sort_values(["year", "month"]).reset_index(drop=True)
        df["lag_1"] = df["price"].shift(1)
        df["lag_2"] = df["price"].shift(2)
        df_train = df.dropna().copy()

        if len(df_train) < 3:
            new_accuracy[province] = entry.get("accuracy", 96.0)
            continue

        X = df_train[["lag_1", "lag_2", "month", "year"]].values
        y = df_train["price"].values

        model = LinearRegression()
        model.fit(X, y)

        y_pred = model.predict(X)
        r2 = r2_score(y, y_pred)
        accuracy = round(max(r2 * 100, 0), 2)

        model_path = province_to_model_file(province)
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        joblib.dump(model, model_path)

        new_accuracy[province] = accuracy

        if len(df) >= 2:
            new_last_prices[province] = {
                "lag_1": float(df["price"].iloc[-1]),
                "lag_2": float(df["price"].iloc[-2]),
            }
        elif len(df) >= 1:
            new_last_prices[province] = {
                "lag_1": float(df["price"].iloc[-1]),
                "lag_2": float(df["price"].iloc[-1]),
            }

        results.append(
            {
                "province": province,
                "accuracy": accuracy,
                "samples": len(df_train),
            }
        )

    ACCURACY_MAP.update(new_accuracy)
    last_prices.update(new_last_prices)

    return {
        "message": f"Trained {len(results)} models",
        "results": results,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
