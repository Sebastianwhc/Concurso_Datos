"""
Geocodifica las direcciones de dengue del Área Metropolitana (Bucaramanga,
Floridablanca, Girón) del Reporte Salud Pública y produce:
  - public/data/metro_puntos.json   : puntos [lon,lat,añoIdx,municipioIdx] (heatmap)
  - public/data/comunas_casos.json  : conteo por comuna de Bucaramanga (point-in-polygon)

Geocoder: Nominatim/OSM (1 req/s + caché reanudable + fallback).
Ejecutar: python scripts/geocode_metro.py
"""
import csv
import json
import os
import re
import time
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "Reporte Salud Pública_Página.csv")
GEOJSON = os.path.join(ROOT, "public", "bucaramanga_comunas.geojson")
CACHE = os.path.join(ROOT, "data", "geocode_cache.json")
OUT_PTS = os.path.join(ROOT, "public", "data", "metro_puntos.json")
OUT_COM = os.path.join(ROOT, "public", "data", "comunas_casos.json")

UA = "ecosalud-ia-dengue/1.0 (concurso datos al ecosistema; research)"
CIUDADES = ["Bucaramanga", "Floridablanca", "Girón"]
VIA = r"(Calle|Carrera|Avenida Calle|Avenida Carrera|Avenida|Diagonal|Transversal)"


def normalize(addr):
    a = addr.split(',')[0]
    for pat, rep in [(r'\bCRA?\b', 'Carrera'), (r'\bKR\b', 'Carrera'), (r'\bKRA\b', 'Carrera'),
                     (r'\bCLL?\b', 'Calle'), (r'\bAV\b', 'Avenida'), (r'\bDG\b', 'Diagonal'),
                     (r'\bTV\b', 'Transversal'), (r'\bAC\b', 'Avenida Calle'), (r'\bAK\b', 'Avenida Carrera')]:
        a = re.sub(pat, rep, a, flags=re.I)
    a = re.sub(r'\b(APTO?|APT|PISO|CASA|BLOQUE|EDF|EDIFICIO|CONJUNTO|PORTERIA|MANZANA|MZ|TORRE|INT|INTERIOR)\b.*',
               '', a, flags=re.I)
    return re.sub(r'\s+', ' ', a).strip()


def street_base(s):
    m = re.match(VIA + r'\s*\d+[A-Za-z]?', s, flags=re.I)
    return m.group(0) if m else None


cache = json.load(open(CACHE, encoding="utf-8")) if os.path.exists(CACHE) else {}


def save_cache():
    json.dump(cache, open(CACHE, "w", encoding="utf-8"), ensure_ascii=False)


def geocode(query):
    if query in cache:
        return cache[query]
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {'q': query, 'format': 'json', 'limit': 1})
    try:
        req = urllib.request.Request(url, headers={'User-Agent': UA})
        r = json.load(urllib.request.urlopen(req, timeout=25))
        res = [round(float(r[0]['lon']), 5), round(float(r[0]['lat']), 5)] if r else None
    except Exception:
        res = None
    cache[query] = res
    time.sleep(1.1)
    return res


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


def main():
    geo = json.load(open(GEOJSON, encoding="utf-8"))

    def comuna_de(lon, lat):
        for f in geo["features"]:
            g = f["geometry"]
            polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
            for poly in polys:
                if pip((lon, lat), poly[0]):
                    return f["properties"]["COD_COMUNA"]
        return None

    rows = []
    with open(SRC, encoding="utf-8", errors="replace", newline="") as f:
        rd = csv.reader(f)
        header = next(rd)
        H = {h.strip().lower(): i for i, h in enumerate(header)}
        i_dir, i_eve, i_zona = H.get("direccion"), H.get("nom_eve"), H.get("zona")
        i_ano = next((H[k] for k in H if re.sub(r'[^a-z]', '', k) in ('ao', 'ano', 'anio')), 8)
        for r in rd:
            if len(r) <= max(i_dir, i_eve, i_zona):
                continue
            if r[i_eve].strip().upper() != "DENGUE" or r[i_zona].strip() not in CIUDADES:
                continue
            anio = re.sub(r"[^0-9]", "", r[i_ano]) if i_ano < len(r) else ""
            rows.append((r[i_dir].strip(), anio, r[i_zona].strip()))

    print(f"Casos de dengue AMB (3 ciudades) con dirección: {len(rows)}")

    years_sorted = ["2023", "2024", "2025"]
    points = []
    by_comuna = {}
    geocoded = 0

    for n, (addr, anio, ciudad) in enumerate(rows, 1):
        norm = normalize(addr)
        if not norm:
            continue
        q = f"{norm}, {ciudad}, Santander, Colombia"
        pt = geocode(q)
        if not pt:
            base = street_base(norm)
            if base:
                pt = geocode(f"{base}, {ciudad}, Santander, Colombia")
        if not pt:
            continue
        geocoded += 1
        yi = years_sorted.index(anio) if anio in years_sorted else -1
        mi = CIUDADES.index(ciudad)
        points.append([pt[0], pt[1], yi, mi])
        if ciudad == "Bucaramanga":
            code = comuna_de(pt[0], pt[1])
            if code:
                c = by_comuna.setdefault(code, {"total": 0, "byYear": {}})
                c["total"] += 1
                if anio:
                    c["byYear"][anio] = c["byYear"].get(anio, 0) + 1
        if n % 50 == 0:
            save_cache()
            print(f"  {n}/{len(rows)} | geocodificados {geocoded}")

    save_cache()
    json.dump({
        "meta": {"total_direcciones": len(rows), "geocodificados": geocoded,
                 "municipios": CIUDADES, "years": years_sorted,
                 "source": "Reporte Salud Pública — direcciones geocodificadas (Nominatim) 2023–2025"},
        "points": points,
    }, open(OUT_PTS, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    json.dump({
        "meta": {"asignados_comuna": sum(c["total"] for c in by_comuna.values()),
                 "years": years_sorted, "source": "Geocodificado por comuna (Bucaramanga)"},
        "byComuna": by_comuna,
    }, open(OUT_COM, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

    print(f"\nOK -> {OUT_PTS} ({len(points)} puntos) + {OUT_COM}")
    print(f"   geocodificados: {geocoded}/{len(rows)}")


if __name__ == "__main__":
    main()
