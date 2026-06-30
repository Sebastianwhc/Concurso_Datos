"""
EXPERIMENTO (no toca producción): ¿mejora el R² con pérdida Poisson y/o una
feature de contagio espacial? Mide variantes sobre el MISMO split temporal
(train <=2023, test 2024-2025) y reporta R²/MAE. NO sobrescribe model.onnx.

Ejecutar: python ml/experiment_model.py
"""
import json
import os

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, r2_score

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TABLE = os.path.join(ROOT, "ml", "data", "training_table.csv")
PUB = os.path.join(ROOT, "public", "data")

STATIC = ["semana", "sin52", "cos52", "incidencia_base", "log_pob", "es_floridablanca"]
CLIMA = ["precip", "temp", "humedad", "precip_acum8", "temp_mean8", "humedad_mean8"]
AR = ["casos_l1", "casos_l2", "casos_l3", "casos_ma4"]
FEATURES = STATIC + CLIMA + AR
TARGET = "casos"


def main():
    df = pd.read_csv(TABLE)
    df[STATIC + CLIMA] = df[STATIC + CLIMA].fillna(df[STATIC + CLIMA].median(numeric_only=True))

    # Índice de semana continuo + features AR (idéntico a train_model.py)
    clima = json.load(open(os.path.join(PUB, "clima_semanal.json"), encoding="utf-8"))["weekly"]
    order = {(w["anio"], w["semana"]): i for i, w in
             enumerate(sorted(clima, key=lambda w: (w["anio"], w["semana"])))}
    df["widx"] = df.apply(lambda r: order.get((r.anio, r.semana), -1), axis=1)
    df = df.sort_values(["comuna", "widx"]).reset_index(drop=True)
    g = df.groupby("comuna")[TARGET]
    df["casos_l1"], df["casos_l2"], df["casos_l3"] = g.shift(1), g.shift(2), g.shift(3)
    df["casos_ma4"] = g.shift(1).rolling(4).mean().reset_index(0, drop=True)

    # Feature de contagio espacial (proxy): media de casos_l1 de las OTRAS comunas
    # del mismo municipio esa semana = "presión epidémica del vecindario".
    s = df.groupby(["municipio", "widx"])["casos_l1"].transform("sum")
    n = df.groupby(["municipio", "widx"])["casos_l1"].transform("count")
    df["vecinos_l1"] = (s - df["casos_l1"]) / (n - 1).clip(lower=1)

    df = df.dropna(subset=AR).reset_index(drop=True)
    df["vecinos_l1"] = df["vecinos_l1"].fillna(0.0)
    train, test = df[df.anio <= 2023], df[df.anio >= 2024]
    yt = test[TARGET].values
    print(f"train {len(train)} (<=2023) | test {len(test)} (2024-25)\n")

    def gbr():
        return GradientBoostingRegressor(n_estimators=400, max_depth=4, learning_rate=0.04,
                                         subsample=0.85, min_samples_leaf=20, random_state=42)

    def hgb(loss):
        return HistGradientBoostingRegressor(loss=loss, max_iter=400, max_depth=4,
                                             learning_rate=0.04, min_samples_leaf=20, random_state=42)

    def run(name, model, feats, log_target):
        y = np.log1p(train[TARGET].values) if log_target else train[TARGET].values
        model.fit(train[feats].values, y)
        p = model.predict(test[feats].values)
        p = np.clip(np.expm1(p) if log_target else p, 0, None)
        return name, r2_score(yt, p), mean_absolute_error(yt, p)

    rows = [
        run("A) GBR  MSE/log1p  (ACTUAL)", gbr(), FEATURES, True),
        run("B) HistGBR MSE/log1p", hgb("squared_error"), FEATURES, True),
        run("C) HistGBR POISSON", hgb("poisson"), FEATURES, False),
        run("D) GBR MSE/log1p + vecinos", gbr(), FEATURES + ["vecinos_l1"], True),
        run("E) HistGBR POISSON + vecinos", hgb("poisson"), FEATURES + ["vecinos_l1"], False),
    ]

    print(f"{'variante':<34} {'R2':>8} {'MAE':>8}")
    print("-" * 52)
    base = rows[0][1]
    for name, r2, mae in rows:
        delta = "" if name.startswith("A)") else f"  (ΔR2 {r2 - base:+.3f})"
        print(f"{name:<34} {r2:>8.3f} {mae:>8.2f}{delta}")


if __name__ == "__main__":
    main()
