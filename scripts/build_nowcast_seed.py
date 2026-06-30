"""
Re-ancla la semilla del simulador a 2026 usando el boletín epidemiológico del INS.

Contexto:
  El modelo es autoregresivo: necesita los casos recientes por comuna como semilla.
  El dato municipal real (Bucaramanga, dengue.json) se corta en 2025-S35 (~agosto).
  El boletín del INS da Santander semanal (acumulado) 2024-2026 y, para 2026,
  también Bucaramanga. Con eso traemos la semilla desde 2025 hasta 2026-S22.

Método:
  1. Diferencia las series acumuladas del boletín -> casos semanales (reset por año).
  2. Calibra f_Bga = Bucaramanga / Santander en el solape donde hay dato real de
     Bucaramanga (2024 completo + 2025 S01-S35). Se VALIDA contra el Bucaramanga
     real de 2026 (del boletín) -> demuestra que la fracción funciona.
  3. Bucaramanga 2026: usa su curva REAL del boletín, desagregada por comuna (share).
  4. Floridablanca 2026: sin dato directo -> estima f_Florida x Santander_2026,
     repartido por la huella histórica de sus comunas (de training_table).
  5. Reconstruye la semilla (últimas 4 semanas, ancla 2026-S22) y la escribe.

Frontera honesta: REAL (Bucaramanga -> 2026-S22) · ESTIMADO (Floridablanca, vía
fracción validada) · PRONÓSTICO (de 2026-S22 en adelante, lo hace el simulador).

Entradas:  data/boletin_santander_semanal.csv (rellenado a mano desde el boletín),
           public/data/dengue.json, ml/data/training_table.csv,
           public/data/model_meta.json
Salidas:   public/data/nowcast_2026.json (semilla nueva + series + validación)

Ejecutar:  python scripts/build_nowcast_seed.py
"""
import csv
import json
import os
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "public", "data")
DATA = os.path.join(ROOT, "data")
ML = os.path.join(ROOT, "ml", "data")
BOLETIN = os.path.join(DATA, "boletin_santander_semanal.csv")

ANCHOR = (2026, 22)          # última semana con Bucaramanga real en el boletín
SEED_WEEKS = [(2026, 19), (2026, 20), (2026, 21), (2026, 22)]  # semilla = 4 semanas


# ---------- 1. Boletín (acumulado ; -> semanal) ----------
def parse_boletin():
    san_cum, bga_cum = {}, {}
    with open(BOLETIN, encoding="utf-8-sig", newline="") as f:
        for row in csv.DictReader(f, delimiter=";"):
            a, s = int(row["anio"]), int(row["semana"])
            san = (row.get("casos_santander") or "").strip()
            bga = (row.get("casos_bucaramanga") or "").strip()
            if san != "":
                san_cum[(a, s)] = float(san)
            if bga != "":
                bga_cum[(a, s)] = float(bga)
    return san_cum, bga_cum


def diff_weekly(cum):
    """Acumulado anual -> incremento semanal (reset en S1 de cada año)."""
    out = {}
    by_year = defaultdict(list)
    for (a, s) in cum:
        by_year[a].append(s)
    for a, sems in by_year.items():
        prev = 0.0
        for s in sorted(sems):
            out[(a, s)] = max(0.0, cum[(a, s)] - prev)
            prev = cum[(a, s)]
    return out


# ---------- 2. Bucaramanga real (ciudad) desde dengue.json ----------
def bga_real_weekly():
    dj = json.load(open(os.path.join(PUB, "dengue.json"), encoding="utf-8"))
    COL = {c: i for i, c in enumerate(dj["columns"])}
    bidx = dj["meta"]["dicts"]["municipio"].index("Bucaramanga")
    w = defaultdict(int)
    for r in dj["rows"]:
        if r[COL["municipio"]] == bidx and r[COL["semana"]] >= 1:
            w[(r[COL["anio"]], r[COL["semana"]])] += 1
    return w


# ---------- 3. Floridablanca real por comuna desde training_table ----------
def florida_real():
    per_comuna = defaultdict(dict)   # cid -> (a,s) -> casos
    city = defaultdict(float)        # (a,s) -> casos ciudad
    with open(os.path.join(ML, "training_table.csv"), encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row["municipio"] == "Floridablanca":
                a, s, c = int(row["anio"]), int(row["semana"]), float(row["casos"])
                per_comuna[row["comuna"]][(a, s)] = c
                city[(a, s)] += c
    return per_comuna, city


def main():
    san_cum, bga_cum = parse_boletin()
    san_w = diff_weekly(san_cum)
    bga_bol_w = diff_weekly(bga_cum)        # boletín Bucaramanga (2026)
    bga_real = bga_real_weekly()            # dengue.json (hasta 2025-S35)

    meta = json.load(open(os.path.join(PUB, "model_meta.json"), encoding="utf-8"))
    share = {c["id"]: c["share"] for c in meta["comunas"]}
    bga_ids = [c["id"] for c in meta["comunas"] if c["municipio"] == "Bucaramanga"]
    fl_ids = [c["id"] for c in meta["comunas"] if c["municipio"] == "Floridablanca"]
    nombre = {c["id"]: c["nombre"] for c in meta["comunas"]}

    # --- Calibración f_Bga (solape con dato municipal real) ---
    overlap = [(a, s) for (a, s) in san_w if a == 2024 or (a == 2025 and s <= 35)]
    sum_bga = sum(bga_real.get(k, 0) for k in overlap)
    sum_san = sum(san_w[k] for k in overlap)
    f_bga = sum_bga / sum_san

    # --- Validación: f_Bga x Santander vs Bucaramanga REAL 2026 (boletín) ---
    san26 = san_cum.get((2026, 22), 0.0)        # acumulado Santander a 2026-S22
    bga26 = bga_cum.get((2026, 22), 0.0)        # acumulado Bucaramanga real a 2026-S22
    f_bga_2026 = bga26 / san26 if san26 else 0.0
    pred26 = f_bga * san26
    err_pct = 100 * (pred26 - bga26) / bga26 if bga26 else 0.0

    # --- Calibración f_Florida (Florida real / Santander en su solape) ---
    fl_pc, fl_city = florida_real()
    fl_overlap = [k for k in fl_city if k in san_w and k[0] in (2024, 2025)]
    sum_fl = sum(fl_city[k] for k in fl_overlap)
    sum_san_fl = sum(san_w[k] for k in fl_overlap)
    f_fl = sum_fl / sum_san_fl if sum_san_fl else 0.0
    fl_tot = sum(sum(d.values()) for d in fl_pc.values()) or 1
    fl_weight = {cid: sum(fl_pc[cid].values()) / fl_tot for cid in fl_pc}

    # --- Semilla nueva (ancla 2026-S22) ---
    seed_new = {}
    for cid in bga_ids:
        seed_new[cid] = [round(bga_bol_w.get((2026, s), 0.0) * share[cid], 2)
                         for (_, s) in SEED_WEEKS]
    for cid in fl_ids:
        seed_new[cid] = [round(f_fl * san_w.get((2026, s), 0.0) * fl_weight.get(cid, 0.0), 2)
                         for (_, s) in SEED_WEEKS]
    last_week_new = {cid: {"anio": ANCHOR[0], "semana": ANCHOR[1]} for cid in seed_new}

    # --- Series semanales para el panel "Situación 2026" / backtest ---
    def serie(weekly, years):
        return [{"anio": a, "semana": s, "casos": round(weekly[(a, s)], 2)}
                for (a, s) in sorted(weekly) if a in years]

    bga_est_florida_2026 = {(2026, s): f_fl * san_w.get((2026, s), 0.0)
                            for s in range(1, ANCHOR[1] + 1)}

    out = {
        "generado": "build_nowcast_seed.py",
        "ancla": {"anio": ANCHOR[0], "semana": ANCHOR[1]},
        "frontera": {
            "real_bucaramanga_hasta": {"anio": 2026, "semana": 22},
            "real_municipal_dengue_json_hasta": {"anio": 2025, "semana": 35},
            "estimado_floridablanca": "f_Florida x Santander (boletin)",
        },
        "calibracion": {
            "f_bga": round(f_bga, 4),
            "f_bga_validacion_2026": round(f_bga_2026, 4),
            "f_bga_error_pct_2026": round(err_pct, 1),
            "f_florida": round(f_fl, 4),
            "overlap_semanas_bga": len(overlap),
            "overlap_semanas_florida": len(fl_overlap),
        },
        "seed": seed_new,
        "last_week": last_week_new,
        "series": {
            "santander": serie(san_w, (2024, 2025, 2026)),
            "bucaramanga_real": serie(bga_bol_w, (2026,)),
            "floridablanca_estimada": serie(bga_est_florida_2026, (2026,)),
        },
    }
    json.dump(out, open(os.path.join(PUB, "nowcast_2026.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)

    # --- Reporte en consola ---
    print("=" * 64)
    print("RE-ANCLAJE NOWCAST 2026")
    print("=" * 64)
    print(f"f_Bga (calibrado 2024 + 2025 S01-S35, {len(overlap)} sem): {f_bga:.4f}")
    print(f"  validación 2026 -> f_Bga real (boletín)            : {f_bga_2026:.4f}")
    print(f"  predicho {pred26:,.0f} vs real {bga26:,.0f} casos   -> error {err_pct:+.1f}%")
    print(f"f_Florida (Florida real / Santander, {len(fl_overlap)} sem): {f_fl:.4f}")
    print()
    bga_tot = sum(bga_bol_w.get((2026, s), 0) for (_, s) in SEED_WEEKS)
    fl_tot_seed = sum(f_fl * san_w.get((2026, s), 0) for (_, s) in SEED_WEEKS)
    print(f"Semilla 2026 (S19-S22) - total ciudad: "
          f"Bga~{bga_tot:.0f}, Florida~{fl_tot_seed:.0f} casos/4sem")
    print("Top 3 comunas Bga por semilla S22:")
    top = sorted(bga_ids, key=lambda c: -seed_new[c][-1])[:3]
    for c in top:
        print(f"  {nombre[c]:28} {seed_new[c]}")
    print(f"\nOK -> public/data/nowcast_2026.json  (ancla {ANCHOR[0]}-S{ANCHOR[1]})")


if __name__ == "__main__":
    main()
