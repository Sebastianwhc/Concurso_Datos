"""
Pipeline offline: unifica el clima (IDEAM diario/mensual + CDMB horario 2025)
en una serie SEMANAL para el dashboard y el modelo de IA.

Entradas (data/):
  - precipitacion.csv  (IDEAM, diario 2007–2026, 4 estaciones)
  - temp.csv           (IDEAM, mensual 2007–2026; se usa Aeropuerto Palonegro)
  - humedad.csv        (IDEAM, diario 2007–ago2024, 2 estaciones)
  - temp_bga_1.csv / temp_bga_2.csv (CDMB, horario 2025: T, HR, PP, PM2.5, PM10…)

Salida: public/data/clima_semanal.json
  - weekly       : [{anio, semana, precip, temp, humedad, pm25}]  (semana ISO)
  - climatologia : promedio por semana (1..53) a lo largo de los años

Ejecutar: python scripts/build_climate_data.py
"""
import csv
import json
import os
from collections import defaultdict
from datetime import date, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, "data")
OUT = os.path.join(ROOT, "public", "data", "clima_semanal.json")


def parse_ideam_date(s):
    return date.fromisoformat(s.strip()[:10])


def num(x):
    try:
        v = float(x)
        return v
    except (ValueError, TypeError):
        return None


# ---------- IDEAM diario: precipitación y humedad (media de estaciones por día) ----------
def ideam_daily(fname, station_filter=None):
    by_date_vals = defaultdict(list)
    with open(os.path.join(D, fname), encoding="utf-8", errors="replace", newline="") as f:
        for row in csv.DictReader(f):
            if station_filter and station_filter not in row["NombreEstacion"].upper():
                continue
            v = num(row["Valor"])
            if v is None:
                continue
            by_date_vals[parse_ideam_date(row["Fecha"])].append(v)
    return by_date_vals


def to_weekly(by_date_vals, agg):
    """agg: 'sum' o 'mean' sobre los valores diarios (ya promediados entre estaciones)."""
    wk = defaultdict(list)
    for d, vals in by_date_vals.items():
        daily = sum(vals) / len(vals)  # media entre estaciones
        iso = d.isocalendar()
        wk[(iso[0], iso[1])].append(daily)
    out = {}
    for k, vals in wk.items():
        out[k] = sum(vals) if agg == "sum" else sum(vals) / len(vals)
    return out


# ---------- Temperatura mensual del valle ----------
# Palonegro (estación del valle) corta en 2019-08. Mogotes sigue hasta 2026 pero
# es de mayor altitud; se corrige con el desfase medido en el solape (+~2.2°C).
def temp_monthly_metro():
    pal, mog = {}, {}
    with open(os.path.join(D, "temp.csv"), encoding="utf-8", errors="replace", newline="") as f:
        for row in csv.DictReader(f):
            v = num(row["Valor"])
            if v is None:
                continue
            d = parse_ideam_date(row["Fecha"])
            name = row["NombreEstacion"].upper()
            if "PALONEGRO" in name:
                pal[(d.year, d.month)] = v
            elif "MOGOTES" in name:
                mog[(d.year, d.month)] = v
    overlap = [pal[k] - mog[k] for k in pal if k in mog]
    offset = round(sum(overlap) / len(overlap), 2) if overlap else 0.0
    monthly = {}
    for k in set(pal) | set(mog):
        if k in pal:
            monthly[k] = pal[k]
        elif k in mog:
            monthly[k] = round(mog[k] + offset, 1)  # Mogotes corregido al valle
    return monthly


# ---------- CDMB horario 2025 -> diario -> semanal ----------
def cdmb_weekly():
    # columna validada por variable (subcadena -> nombre de campo destino)
    want = {"DATOS VALIDOS T": "temp", "DATOS VALIDOS HR": "humedad",
            "DATOS VALIDOS PP": "precip", "DATOS VALIDOS PM 2.5": "pm25"}
    daily = defaultdict(lambda: defaultdict(list))  # date -> var -> [vals]
    for fname in ["temp_bga_1.csv", "temp_bga_2.csv"]:
        path = os.path.join(D, fname)
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8", errors="replace", newline="") as f:
            rd = csv.DictReader(f)
            cols = {k: rd.fieldnames[[c.strip() for c in rd.fieldnames].index(k)]
                    for k in want if k in [c.strip() for c in rd.fieldnames]}
            for row in rd:
                ts = row.get(rd.fieldnames[0], "").strip()
                try:
                    dt = datetime.strptime(ts, "%Y %b %d %I:%M:%S %p")
                except ValueError:
                    continue
                for key, dest in want.items():
                    col = cols.get(key)
                    if not col:
                        continue
                    v = num(row.get(col))
                    if v is not None:
                        daily[dt.date()][dest].append(v)
    # diario: T/HR/PM media, PP suma
    wk = defaultdict(lambda: defaultdict(list))
    for d, vmap in daily.items():
        iso = d.isocalendar()
        for var, vals in vmap.items():
            day = sum(vals) if var == "precip" else sum(vals) / len(vals)
            wk[(iso[0], iso[1])][var].append(day)
    out = {}
    for k, vmap in wk.items():
        out[k] = {var: (sum(vs) if var == "precip" else sum(vs) / len(vs))
                  for var, vs in vmap.items()}
    return out


def main():
    precip = to_weekly(ideam_daily("precipitacion.csv"), "sum")
    humid = to_weekly(ideam_daily("humedad.csv"), "mean")
    tmonth = temp_monthly_metro()
    cdmb = cdmb_weekly()

    # semana ISO -> mes representativo (usamos el jueves de esa semana)
    def week_month(y, w):
        try:
            d = date.fromisocalendar(y, w, 4)
            return (d.year, d.month)
        except ValueError:
            return (y, 1)

    keys = set(precip) | set(humid) | set(cdmb)
    weekly = []
    for (y, w) in sorted(keys):
        if y < 2007 or y > 2026:
            continue
        temp = tmonth.get(week_month(y, w))
        hum = humid.get((y, w))
        pm = None
        c = cdmb.get((y, w))
        if c:  # 2025: completa humedad/temp/precip/pm con CDMB cuando IDEAM falta
            hum = hum if hum is not None else round(c.get("humedad"), 1) if c.get("humedad") else hum
            temp = temp if temp is not None else (round(c["temp"], 1) if "temp" in c else temp)
            pm = round(c["pm25"], 1) if "pm25" in c else None
        weekly.append({
            "anio": y, "semana": w,
            "precip": round(precip[(y, w)], 1) if (y, w) in precip else None,
            "temp": round(temp, 1) if temp is not None else None,
            "humedad": round(hum, 1) if hum is not None else None,
            "pm25": pm,
        })

    # climatología: promedio por semana del año
    clim = defaultdict(lambda: defaultdict(list))
    for r in weekly:
        for k in ("precip", "temp", "humedad"):
            if r[k] is not None:
                clim[r["semana"]][k].append(r[k])
    climatologia = [{
        "semana": s,
        "precip": round(sum(clim[s]["precip"]) / len(clim[s]["precip"]), 1) if clim[s]["precip"] else None,
        "temp": round(sum(clim[s]["temp"]) / len(clim[s]["temp"]), 1) if clim[s]["temp"] else None,
        "humedad": round(sum(clim[s]["humedad"]) / len(clim[s]["humedad"]), 1) if clim[s]["humedad"] else None,
    } for s in range(1, 54) if s in clim]

    years = sorted({r["anio"] for r in weekly})
    out = {
        "meta": {
            "years": years,
            "source": "IDEAM (precip/humedad valle, temp Palonegro) + CDMB 2025 (humedad/PM2.5). Semana ISO.",
            "vars": {"precip": "mm/semana", "temp": "°C", "humedad": "% HR", "pm25": "µg/m³ (solo 2025)"},
        },
        "weekly": weekly,
        "climatologia": climatologia,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

    nz = lambda k: sum(1 for r in weekly if r[k] is not None)
    print(f"OK -> {OUT}")
    print(f"   semanas: {len(weekly)} | años {years[0]}-{years[-1]}")
    print(f"   con precip: {nz('precip')} | temp: {nz('temp')} | humedad: {nz('humedad')} | pm25: {nz('pm25')}")
    print(f"   climatología: {len(climatologia)} semanas")
    ej = next((r for r in weekly if r['anio'] == 2024 and r['semana'] == 20), weekly[0])
    print("   ejemplo (2024 S20):", ej)


if __name__ == "__main__":
    main()
