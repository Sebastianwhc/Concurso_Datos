"""
Pipeline offline: limpia y decodifica el SIVIGILA de dengue de Bucaramanga
y exporta un artefacto columnar compacto para el dashboard (filtrado en el navegador).

Entrada : data/Dengue bucaramanga.csv  (28.6k registros individuales, 76 columnas)
Salida  : public/data/dengue.json      (codificado por enteros + diccionarios)

Ejecutar:  python scripts/build_dashboard_data.py
"""
import csv
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "Dengue bucaramanga.csv")
OUT_DIR = os.path.join(ROOT, "public", "data")
OUT = os.path.join(OUT_DIR, "dengue.json")

MISSING = {"-89", "", "null", "NULL", "NA", "9997", "9998", "9999"}


def norm(s: str) -> str:
    return (s or "").strip().lower()


# --- Síntomas / signos clínicos: (columna_csv, etiqueta) en orden de bits ---
SYMPTOMS = [
    ("fiebre", "Fiebre"),
    ("cefalea", "Cefalea"),
    ("dolrretroo", "Dolor retroocular"),
    ("malgias", "Mialgias"),
    ("artralgia", "Artralgias"),
    ("erupcionr", "Erupción / rash"),
    ("dolor_abdo", "Dolor abdominal"),
    ("vomito", "Vómito"),
    ("diarrea", "Diarrea"),
    ("somnolenci", "Somnolencia"),
    ("hipotensio", "Hipotensión"),
    ("hepatomeg", "Hepatomegalia"),
    ("hem_mucosa", "Hemorragia en mucosas"),
    ("hipotermia", "Hipotermia"),
    ("aum_hemato", "Aumento de hematocrito"),
    ("caida_plaq", "Caída de plaquetas"),
    ("acum_liqui", "Acumulación de líquidos"),
    ("extravasac", "Extravasación"),
    ("hemorr_hem", "Hemorragia"),
    ("choque", "Choque"),
    ("damos_organ", "Daño de órganos"),  # nombre real resuelto en runtime (mojibake)
]

REGIMEN = {
    "c": "Contributivo", "contributivo": "Contributivo",
    "s": "Subsidiado", "subsidiado": "Subsidiado",
    "p": "Excepción", "excepción": "Excepción", "excepcion": "Excepción",
    "e": "Especial", "especial": "Especial",
    "n": "No asegurado", "no asegurado": "No asegurado",
    "i": "Indeterminado", "indeterminado": "Indeterminado",
}

TIPO_CASO = {"1": "Sospechoso", "2": "Probable", "3": "Confirmado por laboratorio",
             "4": "Confirmado por clínica", "5": "Confirmado por nexo"}

# Municipios del área metropolitana (código DANE de 3 dígitos -> nombre).
# Coincide con MPIO_CCDGO de public/amb_metropolitana.geojson.
MUNICIPIOS = {"001": "Bucaramanga", "276": "Floridablanca",
              "307": "Girón", "547": "Piedecuesta"}
MUNI_ORDER = ["Bucaramanga", "Floridablanca", "Girón", "Piedecuesta", "Otro"]

# Orden canónico de diccionarios de salida (índice = valor codificado)
SEX_ORDER = ["F", "M"]
SEV_ORDER = ["Sin signos de alarma", "Con signos de alarma", "Grave", "Sin clasificar"]
ESTRATO_ORDER = ["Sin dato", "1", "2", "3", "4", "5", "6"]
REGIMEN_ORDER = ["Contributivo", "Subsidiado", "Excepción", "Especial",
                 "No asegurado", "Indeterminado", "Sin dato"]
TIPO_ORDER = ["Sospechoso", "Probable", "Confirmado por laboratorio",
              "Confirmado por clínica", "Confirmado por nexo", "Sin dato"]


def edad_sort_key(label: str):
    if "menor" in label.lower():
        return -1
    m = re.match(r"\s*(\d+)", label)
    return int(m.group(1)) if m else 999


def decode_severidad(raw: str) -> str:
    r = norm(raw)
    if "grave" in r:
        return "Grave"
    if "con" in r and "sin" not in r:
        return "Con signos de alarma"
    if "sin" in r:
        return "Sin signos de alarma"
    if r == "1":
        return "Sin signos de alarma"
    if r == "2":
        return "Con signos de alarma"
    if r == "3":
        return "Grave"
    return "Sin clasificar"


def main():
    if not os.path.exists(SRC):
        sys.exit(f"No se encontró el archivo de entrada: {SRC}")

    # Lee con utf-8 tolerante (el archivo trae mojibake en algunos headers/valores)
    with open(SRC, "r", encoding="utf-8", errors="replace", newline="") as f:
        reader = csv.reader(f)
        header = next(reader)
        # Mapa nombre_normalizado -> índice de columna. Resuelve headers con mojibake.
        idx = {}
        for i, h in enumerate(header):
            key = re.sub(r"[^a-z_]", "", norm(h))
            idx[key] = i

    def col(*candidates):
        for c in candidates:
            key = re.sub(r"[^a-z_]", "", c)
            if key in idx:
                return idx[key]
        return None

    i_anio = col("ao", "anio", "anño")  # 'año' con mojibake -> 'ao'
    if i_anio is None:
        i_anio = 5  # posición conocida
    i_sem = col("semana")
    i_sexo = col("sexo_", "sexo")
    i_edad = col("grupo_etario")
    i_estr = col("estrato_", "estrato")
    i_reg = col("tip_ss_", "tipss")
    i_clas = col("clasfinal")
    i_tipc = col("tip_cas_", "tipcas")
    i_hosp = col("pac_hos_", "pachos")
    i_def = col("con_fin_", "confin")
    i_mun = col("cod_mun_r", "codmunr")

    # Resuelve columnas de síntomas (algunos con mojibake)
    sym_idx = []
    for cname, _ in SYMPTOMS:
        key = re.sub(r"[^a-z_]", "", cname)
        ci = idx.get(key)
        if ci is None:
            # busca por prefijo (p.ej. 'damos_organ' real puede diferir)
            ci = next((idx[k] for k in idx if k.startswith(key[:6])), None)
        sym_idx.append(ci)

    edad_set = set()
    rows = []

    with open(SRC, "r", encoding="utf-8", errors="replace", newline="") as f:
        reader = csv.reader(f)
        next(reader)
        for r in reader:
            if not r or len(r) <= i_anio:
                continue
            try:
                anio = int(re.sub(r"[^0-9]", "", r[i_anio]))
            except (ValueError, TypeError):
                continue
            if anio < 2007 or anio > 2026:
                continue
            try:
                semana = int(re.sub(r"[^0-9]", "", r[i_sem]))
            except (ValueError, TypeError):
                semana = 0
            if semana < 1 or semana > 53:
                semana = 0

            sexo = (r[i_sexo].strip().upper() if i_sexo is not None else "")
            sexo_i = SEX_ORDER.index(sexo) if sexo in SEX_ORDER else -1

            edad = norm(r[i_edad]) if i_edad is not None else ""
            edad = re.sub(r"\s+", " ", edad)
            if edad and edad not in MISSING:
                edad_set.add(edad)

            estr_raw = norm(r[i_estr]) if i_estr is not None else ""
            estr = estr_raw if estr_raw in {"1", "2", "3", "4", "5", "6"} else "Sin dato"
            estr_i = ESTRATO_ORDER.index(estr)

            reg_raw = norm(r[i_reg]) if i_reg is not None else ""
            reg = REGIMEN.get(reg_raw, "Sin dato")
            reg_i = REGIMEN_ORDER.index(reg)

            sev = decode_severidad(r[i_clas] if i_clas is not None else "")
            sev_i = SEV_ORDER.index(sev)

            tipc_raw = r[i_tipc].strip() if i_tipc is not None else ""
            tipo = TIPO_CASO.get(tipc_raw, "Sin dato")
            tipo_i = TIPO_ORDER.index(tipo)

            hosp = 1 if (i_hosp is not None and r[i_hosp].strip() == "1") else 0
            fall = 1 if (i_def is not None and r[i_def].strip() == "2") else 0

            mask = 0
            for bit, ci in enumerate(sym_idx):
                if ci is not None and ci < len(r) and r[ci].strip() == "1":
                    mask |= (1 << bit)

            mun_raw = (r[i_mun].strip() if i_mun is not None else "")
            mun_code = mun_raw.zfill(3) if mun_raw.isdigit() else mun_raw
            mun = MUNICIPIOS.get(mun_code, "Otro")
            mun_i = MUNI_ORDER.index(mun)

            rows.append([anio, semana, sexo_i, edad, estr_i, reg_i,
                         sev_i, tipo_i, hosp, fall, mask, mun_i])

    # Diccionario de edad ordenado y reemplazo de etiqueta por índice
    edad_order = sorted(edad_set, key=edad_sort_key)
    edad_order_disp = [e.replace(" a ", " a ").capitalize() for e in edad_order]
    edad_index = {e: i for i, e in enumerate(edad_order)}
    for row in rows:
        row[3] = edad_index.get(row[3], -1)

    years = sorted({row[0] for row in rows})

    out = {
        "meta": {
            "total": len(rows),
            "years": years,
            "source": "SIVIGILA - Dengue Bucaramanga (individual, 2015-2025)",
            "dicts": {
                "sexo": SEX_ORDER,
                "edad": edad_order_disp,
                "estrato": ESTRATO_ORDER,
                "regimen": REGIMEN_ORDER,
                "severidad": SEV_ORDER,
                "tipo_caso": TIPO_ORDER,
                "municipio": MUNI_ORDER,
            },
            "symptoms": [label for _, label in SYMPTOMS],
            "municipio_codigos": MUNICIPIOS,
        },
        "columns": ["anio", "semana", "sexo", "edad", "estrato", "regimen",
                    "severidad", "tipo_caso", "hosp", "fallecido", "sintomas", "municipio"],
        "rows": rows,
    }

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

    size_kb = os.path.getsize(OUT) / 1024
    print(f"OK -> {OUT}")
    print(f"   registros: {len(rows)} | años: {years[0]}-{years[-1]} | tamaño: {size_kb:.0f} KB")
    print(f"   grupos de edad: {edad_order_disp}")
    # Verificación rápida
    deaths = sum(r[9] for r in rows)
    hosp = sum(r[8] for r in rows)
    print(f"   hospitalizados: {hosp} | fallecidos: {deaths}")


if __name__ == "__main__":
    main()
