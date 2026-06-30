"""
Backtest del modelo contra el brote REAL de 2024 (Bucaramanga).

Idea: anclar el modelo a inicios de 2024 (solo con datos hasta esa semana),
proyectar de forma autoregresiva con el CLIMA REAL de 2024, y comparar la curva
proyectada contra lo que de verdad pasó (dengue.json). Demuestra que el modelo
habría anticipado el brote — la baza de credibilidad para la sustentación.

Es honesto: usa el clima real observado (no escenarios) y la misma ingeniería de
features con la que se entrenó (ventanas reales de 8 semanas + recursión AR).

Entradas:  public/data/model.onnx, model_meta.json, clima_semanal.json, dengue.json,
           public/data/nowcast_2026.json (para el error de validación de la fracción)
Salida:    public/data/backtest_2024.json (semanas, real, forecast, métricas)

Ejecutar:  python scripts/build_backtest_2024.py
"""
import json
import math
import os
from collections import defaultdict

import numpy as np
import onnxruntime as ort

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "public", "data")

ANCHOR = (2024, 8)   # última semana "observada" del backtest (modelo ciego de ahí en adelante)
H = 16               # semanas proyectadas


def load(p):
    return json.load(open(os.path.join(PUB, p), encoding="utf-8"))


def main():
    meta = load("model_meta.json")
    clima = load("clima_semanal.json")["weekly"]
    dj = load("dengue.json")
    try:
        nowcast = load("nowcast_2026.json")
        frac_err = nowcast["calibracion"]["f_bga_error_pct_2026"]
    except Exception:
        frac_err = None

    # --- Bucaramanga real (ciudad) por semana, desde dengue.json ---
    COL = {c: i for i, c in enumerate(dj["columns"])}
    bidx = dj["meta"]["dicts"]["municipio"].index("Bucaramanga")
    city = defaultdict(int)
    for r in dj["rows"]:
        if r[COL["municipio"]] == bidx and r[COL["semana"]] >= 1:
            city[(r[COL["anio"]], r[COL["semana"]])] += 1

    # --- Índice continuo de clima (para ventanas de 8 semanas reales) ---
    cl = sorted(clima, key=lambda w: (w["anio"], w["semana"]))
    cidx = {(w["anio"], w["semana"]): i for i, w in enumerate(cl)}

    def clim_at(anio, sem):
        i = cidx.get((anio, sem))
        if i is None:
            return None
        cur = cl[i]

        def win(var, agg):
            vals = [cl[i - l][var] for l in range(1, 9) if i - l >= 0 and cl[i - l][var] is not None]
            if not vals:
                return 0.0
            return sum(vals) if agg == "sum" else sum(vals) / len(vals)
        return {
            "precip": cur["precip"] or 0.0, "temp": cur["temp"] or 0.0, "humedad": cur["humedad"] or 0.0,
            "precip_acum8": win("precip", "sum"), "temp_mean8": win("temp", "mean"), "humedad_mean8": win("humedad", "mean"),
        }

    bga = [c for c in meta["comunas"] if c["municipio"] == "Bucaramanga"]
    sess = ort.InferenceSession(os.path.join(PUB, "model.onnx"))

    def feats(c, sem, clm, hist):
        l1, l2, l3 = hist[-1], hist[-2], hist[-3]
        ma4 = sum(hist[-4:]) / 4
        return [sem, math.sin(2 * math.pi * sem / 52), math.cos(2 * math.pi * sem / 52),
                c["incidencia_base"], round(math.log1p(c["pob"]), 3), 0.0,
                clm["precip"], clm["temp"], clm["humedad"], clm["precip_acum8"], clm["temp_mean8"], clm["humedad_mean8"],
                l1, l2, l3, ma4]

    ay, aw = ANCHOR
    # Semilla por comuna = ciudad×share en las 4 semanas previas al ancla (A-3..A)
    hist = {c["id"]: [city.get((ay, aw - 3 + k), 0) * c["share"] for k in range(4)] for c in bga}

    proj, real_h, weeks_h = [], [], []
    for k in range(1, H + 1):
        sem = aw + k
        clm = clim_at(ay, sem)
        X = np.array([feats(c, sem, clm, hist[c["id"]]) for c in bga], dtype=np.float32)
        out = sess.run(None, {"input": X})[0].ravel()
        pred = np.maximum(0, np.expm1(out))
        for j, c in enumerate(bga):
            hist[c["id"]].append(float(pred[j]))
        proj.append(round(float(pred.sum()), 1))
        real_h.append(city.get((ay, sem), 0))
        weeks_h.append(sem)

    # MAE del backtest (proyectado vs real, en el horizonte)
    mae = float(np.mean(np.abs(np.array(proj) - np.array(real_h))))

    # --- Serie de display: S1..A+H con contexto previo ---
    last_sem = aw + H
    weeks = list(range(1, last_sem + 1))
    real_full = [city.get((ay, s), 0) for s in weeks]
    # forecast: null antes del ancla; en el ancla = real (para que la línea parta de ahí); luego proj
    fc = [None] * len(weeks)
    fc[aw - 1] = city.get((ay, aw), 0)
    for k in range(1, H + 1):
        fc[aw - 1 + k] = proj[k - 1]

    out = {
        "ancla": {"anio": ay, "semana": aw},
        "horizonte": H,
        "ciudad": "Bucaramanga",
        "weeks": weeks,
        "real": real_full,
        "forecast": fc,
        "metrics": {
            "backtest_mae": round(mae, 2),
            "modelo": meta["metrics"]["modelo"],
            "baseline": meta["metrics"]["baseline"],
            "fraccion_2026_error_pct": frac_err,
        },
    }
    json.dump(out, open(os.path.join(PUB, "backtest_2024.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)

    print("=" * 60)
    print(f"BACKTEST 2024 · Bucaramanga · ancla {ay}-S{aw} · horizonte {H} sem")
    print("=" * 60)
    print(f"{'sem':>4} {'real':>7} {'modelo':>8}")
    for s, r, p in zip(weeks_h, real_h, proj):
        print(f"{s:>4} {r:>7} {p:>8.0f}")
    print(f"\nMAE backtest: {mae:.1f} casos/sem")
    print(f"real total {H} sem: {sum(real_h)}  |  modelo total: {sum(proj):.0f}")
    print(f"\nOK -> public/data/backtest_2024.json")


if __name__ == "__main__":
    main()
