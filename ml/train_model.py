"""
Entrena el modelo de pronóstico de dengue por comuna-semana y lo exporta a ONNX.

Modelo: HistGradientBoostingRegressor (gradient boosting por histogramas, sklearn).
  Se eligió sobre XGBoost porque skl2onnx lo exporta FIEL a ONNX (XGBoost+onnxmltools
  rompe la conversión). Mismo tipo de modelo (ensamblaje de árboles con boosting).

Enfoque: PRONÓSTICO autoregresivo + clima como modulador.
  - Target = log1p(casos); el frontend aplica expm1 a la salida ONNX.
  - Validación temporal: train ≤ 2023, test 2024-2025 (año epidémico = prueba dura).
  - Salidas: public/data/model.onnx, public/data/model_meta.json, ml/data/metrics.json

Ejecutar: python ml/train_model.py
"""
import json
import os

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.inspection import permutation_importance
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TABLE = os.path.join(ROOT, "ml", "data", "training_table.csv")
PUB = os.path.join(ROOT, "public", "data")

STATIC = ["semana", "sin52", "cos52", "incidencia_base", "log_pob", "es_floridablanca"]
CLIMA = ["precip", "temp", "humedad", "precip_acum8", "temp_mean8", "humedad_mean8"]
AR = ["casos_l1", "casos_l2", "casos_l3", "casos_ma4"]
FEATURES = STATIC + CLIMA + AR
TARGET = "casos"


def metrics(y, p, label):
    return {"set": label, "MAE": round(mean_absolute_error(y, p), 3),
            "RMSE": round(mean_squared_error(y, p) ** 0.5, 3),
            "R2": round(r2_score(y, p), 3)}


def mk_model():
    return GradientBoostingRegressor(
        n_estimators=400, max_depth=4, learning_rate=0.04,
        subsample=0.85, min_samples_leaf=20, random_state=42)


def main():
    df = pd.read_csv(TABLE)
    medians = df[STATIC + CLIMA].median(numeric_only=True)
    df[STATIC + CLIMA] = df[STATIC + CLIMA].fillna(medians)

    # Índice de semana continuo (para rezagos autoregresivos por comuna)
    clima = json.load(open(os.path.join(PUB, "clima_semanal.json"), encoding="utf-8"))["weekly"]
    order = {(w["anio"], w["semana"]): i for i, w in
             enumerate(sorted(clima, key=lambda w: (w["anio"], w["semana"])))}
    df["widx"] = df.apply(lambda r: order.get((r.anio, r.semana), -1), axis=1)
    df = df.sort_values(["comuna", "widx"]).reset_index(drop=True)
    g = df.groupby("comuna")[TARGET]
    df["casos_l1"], df["casos_l2"], df["casos_l3"] = g.shift(1), g.shift(2), g.shift(3)
    df["casos_ma4"] = g.shift(1).rolling(4).mean().reset_index(0, drop=True)
    df = df.dropna(subset=AR).reset_index(drop=True)

    train, test = df[df.anio <= 2023], df[df.anio >= 2024]
    print(f"train: {len(train)} (<=2023) | test: {len(test)} (2024-2025)")

    base = train.groupby(["comuna", "semana"])[TARGET].mean()
    glob = train[TARGET].mean()
    base_pred = test.apply(lambda r: base.get((r["comuna"], r["semana"]), glob), axis=1).values

    model = mk_model()
    model.fit(train[FEATURES].values, np.log1p(train[TARGET].values))
    pte = np.clip(np.expm1(model.predict(test[FEATURES].values)), 0, None)

    m_base = metrics(test[TARGET].values, base_pred, "baseline (climatologia)")
    m_xgb = metrics(test[TARGET].values, pte, "histgbm (pronostico AR+clima)")
    print("\n=== test 2024-2025 ===")
    for m in (m_base, m_xgb):
        print(f"  {m['set']:34} MAE={m['MAE']:.2f}  RMSE={m['RMSE']:.2f}  R2={m['R2']:+.3f}")

    r = permutation_importance(model, test[FEATURES].values, np.log1p(test[TARGET].values),
                               n_repeats=4, random_state=42)
    imp = sorted(zip(FEATURES, r.importances_mean), key=lambda x: -x[1])
    print("\n=== Importancia (permutación) ===")
    for f, v in imp[:8]:
        print(f"  {f:16} {v:.3f}")

    # Modelo final con TODO -> ONNX (skl2onnx)
    final = mk_model()
    final.fit(df[FEATURES].values, np.log1p(df[TARGET].values))
    from skl2onnx import convert_sklearn
    from skl2onnx.common.data_types import FloatTensorType
    onx = convert_sklearn(final, initial_types=[("input", FloatTensorType([None, len(FEATURES)]))],
                          target_opset=17)
    with open(os.path.join(PUB, "model.onnx"), "wb") as f:
        f.write(onx.SerializeToString())

    # Auto-verificación de fidelidad ONNX (mismo modelo final)
    import onnxruntime as ort
    Xs = df[FEATURES].sample(8, random_state=1).values.astype(np.float32)
    skl_out = final.predict(Xs)
    onx_out = ort.InferenceSession(os.path.join(PUB, "model.onnx")).run(None, {"input": Xs})[0].ravel()
    print(f"\n[self-check] max |sklearn - ONNX| (log space) = {float(np.max(np.abs(skl_out - onx_out))):.6f}")

    # Semilla: últimos 4 casos por comuna (estado inicial del pronóstico)
    seed, last_week = {}, {}
    for cid, sub in df.sort_values("widx").groupby("comuna"):
        tail = sub.tail(4)
        seed[cid] = [round(float(v), 2) for v in tail[TARGET].values]
        lw = tail.iloc[-1]
        last_week[cid] = {"anio": int(lw.anio), "semana": int(lw.semana)}

    cf = json.load(open(os.path.join(ROOT, "ml", "data", "comuna_features.json"), encoding="utf-8"))
    ranges = {v: {"min": round(float(df[v].quantile(0.05)), 1),
                  "max": round(float(df[v].quantile(0.95)), 1),
                  "med": round(float(df[v].median()), 1)} for v in ["precip", "temp", "humedad"]}
    meta = {
        "feature_order": FEATURES, "target_transform": "log1p",
        "static_features": STATIC, "clima_features": CLIMA, "ar_features": AR,
        "medians": {k: round(float(v), 3) for k, v in medians.items()},
        "clima_ranges": ranges, "comunas": cf["comunas"],
        "seed": seed, "last_week": last_week,
        "metrics": {"baseline": m_base, "modelo": m_xgb},
        "nota": "HistGradientBoosting; pronóstico autoregresivo (casos recientes) + clima "
                "modulador. Salida en log1p -> aplicar expm1. El simulador realimenta la "
                "predicción para proyectar semana a semana.",
    }
    json.dump(meta, open(os.path.join(PUB, "model_meta.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)
    json.dump({"baseline": m_base, "modelo": m_xgb,
               "importancia": [{"feature": f, "valor": round(float(v), 4)} for f, v in imp]},
              open(os.path.join(ROOT, "ml", "data", "metrics.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)

    sz = os.path.getsize(os.path.join(PUB, "model.onnx")) / 1024
    print(f"\nOK -> public/model.onnx ({sz:.0f} KB) + model_meta.json + seed por comuna")


if __name__ == "__main__":
    main()
