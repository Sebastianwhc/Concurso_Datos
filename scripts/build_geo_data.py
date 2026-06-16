"""
Pipeline offline: agrega el archivo nacional de SIVIGILA (218MB) a conteos de
dengue por municipio de Santander, para el coropleto del dashboard.

Entrada : data/Datos_de_Vigilancia_en_Salud_Pública_de_Colombia_20260515.csv
Salida  : public/data/santander_dengue.json  (87 municipios, total y por año)

Ejecutar:  python scripts/build_geo_data.py
"""
import csv
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data",
                   "Datos_de_Vigilancia_en_Salud_Pública_de_Colombia_20260515.csv")
OUT = os.path.join(ROOT, "public", "data", "santander_dengue.json")

DENGUE_EVENTS = {"DENGUE", "DENGUE GRAVE", "MORTALIDAD POR DENGUE"}


def digits(s: str) -> str:
    return re.sub(r"[^0-9]", "", s or "")


def main():
    if not os.path.exists(SRC):
        sys.exit(f"No se encontró el archivo nacional: {SRC}")

    # municipio_code(3) -> {"name": str, "total": int, "graves": int, "byYear": {anio:int}}
    munis: dict[str, dict] = {}
    years: set[int] = set()
    rows_read = 0

    with open(SRC, "r", encoding="utf-8", errors="replace", newline="") as f:
        reader = csv.reader(f)
        header = next(reader)
        H = {re.sub(r"[^a-z_]", "", h.strip().lower()): i for i, h in enumerate(header)}
        i_eve = H.get("nombre_evento")
        i_ano = H.get("ano")
        i_dpto = H.get("departamento_ocurrencia")
        i_mun = H.get("cod_mun_o")
        i_munn = H.get("municipio_ocurrencia")
        i_cnt = H.get("conteo")

        for r in reader:
            rows_read += 1
            if len(r) <= i_cnt:
                continue
            if (r[i_dpto] or "").strip().upper() != "SANTANDER":
                continue
            eve = (r[i_eve] or "").strip().upper()
            if eve not in DENGUE_EVENTS:
                continue

            code = digits(r[i_mun])[-3:].zfill(3)  # 68001 -> 001
            try:
                anio = int(digits(r[i_ano]))
                cnt = int(digits(r[i_cnt]) or 0)
            except ValueError:
                continue

            m = munis.setdefault(code, {
                "name": (r[i_munn] or "").strip().title(),
                "total": 0, "graves": 0, "byYear": {},
            })
            m["total"] += cnt
            if eve == "DENGUE GRAVE":
                m["graves"] += cnt
            m["byYear"][anio] = m["byYear"].get(anio, 0) + cnt
            years.add(anio)

    years_sorted = sorted(years)
    municipios = [
        {"code": code, "name": m["name"], "total": m["total"],
         "graves": m["graves"], "byYear": m["byYear"]}
        for code, m in sorted(munis.items(), key=lambda kv: -kv[1]["total"])
    ]

    max_total = max((m["total"] for m in municipios), default=0)
    # máximo por año (para escalar el visualMap cuando se filtra por año)
    max_by_year = {}
    for y in years_sorted:
        max_by_year[y] = max((m["byYear"].get(y, 0) for m in municipios), default=0)

    out = {
        "meta": {
            "years": years_sorted,
            "max_total": max_total,
            "max_by_year": max_by_year,
            "source": "SIVIGILA nacional — dengue por municipio de ocurrencia (Santander)",
        },
        "municipios": municipios,
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

    print(f"OK -> {OUT}")
    print(f"   filas leídas: {rows_read:,} | municipios Santander: {len(municipios)}")
    print(f"   años: {years_sorted[0]}-{years_sorted[-1]} | máx total municipio: {max_total:,}")
    print("   top 5:", [(m["name"], m["total"]) for m in municipios[:5]])


if __name__ == "__main__":
    main()
