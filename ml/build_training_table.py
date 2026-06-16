"""
Construye la tabla de entrenamiento del modelo (comuna × semana × clima + features).

Estrategia metropolitana:
  - Bucaramanga (17 comunas, 2015-2025): la curva semanal de la ciudad (dataset
    individual de 28k) se DESAGREGA por comuna usando la huella espacial
    geocodificada (share estático por comuna).
  - Floridablanca (8 comunas, 2023-2025): conteo geocodificado real por comuna
    y semana (direcciones del Reporte SP -> caché -> point-in-polygon).
  - Features: clima de la semana + rezagos (4-10 sem), estacionalidad, población
    y la incidencia base por comuna.

Entradas:  public/data/dengue.json, public/data/clima_semanal.json,
           data/Reporte..csv, data/geocode_cache.json,
           data/amb_comunas_raw.json, data/florida_comunas_raw.json
Salidas:   ml/data/training_table.csv, ml/data/comuna_features.json

Ejecutar:  python ml/build_training_table.py
"""
import csv
import json
import math
import os
import re
from collections import defaultdict
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "public", "data")
DATA = os.path.join(ROOT, "data")
OUT_DIR = os.path.join(ROOT, "ml", "data")

MES = {"ene": 1, "feb": 2, "mar": 3, "abr": 4, "may": 5, "jun": 6,
       "jul": 7, "ago": 8, "sep": 9, "oct": 10, "nov": 11, "dic": 12}

VIA = r"(Calle|Carrera|Avenida Calle|Avenida Carrera|Avenida|Diagonal|Transversal)"


def parse_fec(s):
    m = re.match(r"(\d{1,2})\s+([a-záéíóú]+)\.?\s+(\d{4})", (s or "").strip().lower())
    if not m:
        return None
    mo = MES.get(m.group(2)[:3])
    if not mo:
        return None
    try:
        return date(int(m.group(3)), mo, int(m.group(1)))
    except ValueError:
        return None


def normalize(addr):
    a = addr.split(",")[0]
    for pat, rep in [(r"\bCRA?\b", "Carrera"), (r"\bKR\b", "Carrera"), (r"\bKRA\b", "Carrera"),
                     (r"\bCLL?\b", "Calle"), (r"\bAV\b", "Avenida"), (r"\bDG\b", "Diagonal"),
                     (r"\bTV\b", "Transversal"), (r"\bAC\b", "Avenida Calle"), (r"\bAK\b", "Avenida Carrera")]:
        a = re.sub(pat, rep, a, flags=re.I)
    a = re.sub(r"\b(APTO?|APT|PISO|CASA|BLOQUE|EDF|EDIFICIO|CONJUNTO|PORTERIA|MANZANA|MZ|TORRE|INT|INTERIOR)\b.*",
               "", a, flags=re.I)
    return re.sub(r"\s+", " ", a).strip()


def street_base(s):
    m = re.match(VIA + r"\s*\d+[A-Za-z]?", s, flags=re.I)
    return m.group(0) if m else None


def pip(pt, ring):
    x, y = pt
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi):
            inside = not inside
        j = i
    return inside


def load_comunas():
    """Lista de comunas con polígono y población (Bga + Floridablanca)."""
    comunas = []
    bga = json.load(open(os.path.join(DATA, "amb_comunas_raw.json"), encoding="utf-8"))
    for f in bga["features"]:
        p = f["properties"]
        comunas.append({"id": f"B{p['COD_COMUNA']}", "municipio": "Bucaramanga",
                        "nombre": (p.get("NOMBRE_COM") or f"Comuna {p['COD_COMUNA']}").strip(),
                        "pob": int(p.get("PERSONAS_S") or 0), "geom": f["geometry"]})
    fl = json.load(open(os.path.join(DATA, "florida_comunas_raw.json"), encoding="utf-8"))
    for f in fl["features"]:
        p = f["properties"]
        comunas.append({"id": f"F{p['CODCOM']}", "municipio": "Floridablanca",
                        "nombre": (p.get("NOMBRE") or "").replace("_", " / ").strip(),
                        "pob": int(p.get("Total") or 0), "geom": f["geometry"]})
    return comunas


def locate(comunas, lon, lat):
    for c in comunas:
        g = c["geom"]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        for poly in polys:
            if pip((lon, lat), poly[0]):
                return c["id"]
    return None


def main():
    comunas = load_comunas()
    by_id = {c["id"]: c for c in comunas}
    cache = json.load(open(os.path.join(DATA, "geocode_cache.json"), encoding="utf-8"))

    # --- Casos geocodificados por comuna-semana (Bga + Florida, 2023-2025) ---
    geo_cw = defaultdict(int)          # (comuna_id, anio, semana) -> casos
    geo_comuna_tot = defaultdict(int)  # comuna_id -> total (para el share)
    with open(os.path.join(DATA, "Reporte Salud Pública_Página.csv"),
              encoding="utf-8", errors="replace", newline="") as f:
        for row in csv.DictReader(f):
            if row.get("nom_eve") != "DENGUE" or row.get("Zona") not in ("Bucaramanga", "Floridablanca"):
                continue
            ciudad = row["Zona"]
            norm = normalize(row.get("direccion", ""))
            if not norm:
                continue
            q = f"{norm}, {ciudad}, Santander, Colombia"
            pt = cache.get(q)
            if not pt:
                base = street_base(norm)
                pt = cache.get(f"{base}, {ciudad}, Santander, Colombia") if base else None
            if not pt:
                continue
            cid = locate(comunas, pt[0], pt[1])
            if not cid:
                continue
            geo_comuna_tot[cid] += 1
            d = parse_fec(row.get("fec_con_", ""))
            if d:
                iso = d.isocalendar()
                geo_cw[(cid, iso[0], iso[1])] += 1

    # --- Curva semanal de Bucaramanga (ciudad) desde el dataset de 28k ---
    dj = json.load(open(os.path.join(PUB, "dengue.json"), encoding="utf-8"))
    COL = {c: i for i, c in enumerate(dj["columns"])}
    muni_dict = dj["meta"]["dicts"]["municipio"]
    bga_idx = muni_dict.index("Bucaramanga")
    city_week = defaultdict(int)  # (anio, semana) -> casos ciudad
    for r in dj["rows"]:
        if r[COL["municipio"]] == bga_idx and r[COL["semana"]] >= 1:
            city_week[(r[COL["anio"]], r[COL["semana"]])] += 1

    # Share espacial de Bucaramanga (de los geocodificados)
    bga_ids = [c["id"] for c in comunas if c["municipio"] == "Bucaramanga"]
    bga_geo_total = sum(geo_comuna_tot[i] for i in bga_ids) or 1
    share = {i: geo_comuna_tot[i] / bga_geo_total for i in bga_ids}

    # --- Clima semanal + rezagos ---
    clima = json.load(open(os.path.join(PUB, "clima_semanal.json"), encoding="utf-8"))["weekly"]
    clima_sorted = sorted(clima, key=lambda w: (w["anio"], w["semana"]))
    cidx = {(w["anio"], w["semana"]): i for i, w in enumerate(clima_sorted)}

    def clim_at(anio, sem, lag, var):
        i = cidx.get((anio, sem))
        if i is None or i - lag < 0:
            return None
        return clima_sorted[i - lag][var]

    def clim_roll(anio, sem, lo, hi, var, agg):
        """Agrega var sobre los rezagos [lo, hi] (clima sostenido / acumulado)."""
        i = cidx.get((anio, sem))
        if i is None:
            return None
        vals = [clima_sorted[i - l][var] for l in range(lo, hi + 1)
                if i - l >= 0 and clima_sorted[i - l][var] is not None]
        if not vals:
            return None
        return round(sum(vals) if agg == "sum" else sum(vals) / len(vals), 2)

    # --- Incidencia base por comuna (casos geocodificados por 1000 hab) ---
    incidencia_base = {c["id"]: round(1000 * geo_comuna_tot[c["id"]] / c["pob"], 3) if c["pob"] else 0.0
                       for c in comunas}

    # --- Filas de la tabla ---
    rows = []

    def add_row(cid, anio, sem, casos):
        c = by_id[cid]
        feat = {
            "comuna": cid, "municipio": c["municipio"], "anio": anio, "semana": sem,
            "casos": round(casos, 3),
            "pob": c["pob"], "log_pob": round(math.log1p(c["pob"]), 3),
            "incidencia_base": incidencia_base[cid],
            "es_floridablanca": 1 if c["municipio"] == "Floridablanca" else 0,
            "sin52": round(math.sin(2 * math.pi * sem / 52), 4),
            "cos52": round(math.cos(2 * math.pi * sem / 52), 4),
            "precip": clim_at(anio, sem, 0, "precip"),
            "temp": clim_at(anio, sem, 0, "temp"),
            "humedad": clim_at(anio, sem, 0, "humedad"),
            "precip_l2": clim_at(anio, sem, 2, "precip"),
            "precip_l4": clim_at(anio, sem, 4, "precip"),
            "precip_l6": clim_at(anio, sem, 6, "precip"),
            "precip_l8": clim_at(anio, sem, 8, "precip"),
            "temp_l4": clim_at(anio, sem, 4, "temp"),
            "temp_l8": clim_at(anio, sem, 8, "temp"),
            "humedad_l4": clim_at(anio, sem, 4, "humedad"),
            "precip_acum4": clim_roll(anio, sem, 1, 4, "precip", "sum"),
            "precip_acum8": clim_roll(anio, sem, 1, 8, "precip", "sum"),
            "precip_acum12": clim_roll(anio, sem, 1, 12, "precip", "sum"),
            "temp_mean8": clim_roll(anio, sem, 1, 8, "temp", "mean"),
            "humedad_mean8": clim_roll(anio, sem, 1, 8, "humedad", "mean"),
        }
        rows.append(feat)

    # Bucaramanga: desagregación ciudad × share (2015-2025)
    for (anio, sem), tot in city_week.items():
        for cid in bga_ids:
            add_row(cid, anio, sem, tot * share[cid])

    # Floridablanca: geocodificado real por comuna-semana (2023-2025)
    fl_ids = [c["id"] for c in comunas if c["municipio"] == "Floridablanca"]
    fl_weeks = sorted({(a, s) for (cid, a, s) in geo_cw if cid in fl_ids})
    for (anio, sem) in fl_weeks:
        for cid in fl_ids:
            add_row(cid, anio, sem, geo_cw.get((cid, anio, sem), 0))

    # --- Escritura ---
    os.makedirs(OUT_DIR, exist_ok=True)
    cols = list(rows[0].keys())
    with open(os.path.join(OUT_DIR, "training_table.csv"), "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        w.writerows(rows)

    # Features estáticas por comuna (para el frontend del simulador)
    comuna_features = [{"id": c["id"], "municipio": c["municipio"], "nombre": c["nombre"],
                        "pob": c["pob"], "incidencia_base": incidencia_base[c["id"]],
                        "share": round(share.get(c["id"], 0), 4)} for c in comunas]
    json.dump({"comunas": comuna_features, "feature_cols": [c for c in cols if c not in ("comuna", "municipio", "casos")]},
              open(os.path.join(OUT_DIR, "comuna_features.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)

    print(f"OK -> ml/data/training_table.csv  ({len(rows)} filas, {len(cols)} columnas)")
    print(f"   Bucaramanga: {len([r for r in rows if r['municipio']=='Bucaramanga'])} filas (17 comunas × semanas 2015-2025)")
    print(f"   Floridablanca: {len([r for r in rows if r['municipio']=='Floridablanca'])} filas (8 comunas × semanas 2023-2025)")
    print(f"   geocodificados asignados: Bga={sum(geo_comuna_tot[i] for i in bga_ids)}, Fl={sum(geo_comuna_tot[i] for i in fl_ids)}")
    print(f"   share Bga (top 3): {sorted(((by_id[i]['nombre'], round(share[i],3)) for i in bga_ids), key=lambda x:-x[1])[:3]}")
    miss = sum(1 for r in rows if r['precip_l8'] is None)
    print(f"   filas sin precip_l8 (rezago al inicio de la serie): {miss}")


if __name__ == "__main__":
    main()
