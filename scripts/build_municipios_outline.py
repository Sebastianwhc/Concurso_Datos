"""
Disuelve amb_comunas.geojson en el contorno de cada municipio (Bucaramanga,
Floridablanca) uniendo sus comunas en un solo polígono. Sirve para dibujar el
borde del municipio en el simulador SIN mostrar las líneas internas de comuna.

Salida: public/amb_municipios.geojson  (2 features: una por municipio)
Ejecutar: python scripts/build_municipios_outline.py
"""
import json
import os
from collections import defaultdict

from shapely.geometry import mapping, shape
from shapely.ops import unary_union

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "public", "amb_comunas.geojson")
OUT = os.path.join(ROOT, "public", "amb_municipios.geojson")


def main():
    gj = json.load(open(SRC, encoding="utf-8"))
    by_muni = defaultdict(list)
    for f in gj["features"]:
        by_muni[f["properties"]["municipio"]].append(shape(f["geometry"]))

    features = []
    for muni, geoms in by_muni.items():
        # buffer(0) limpia auto-intersecciones; unary_union disuelve bordes internos.
        merged = unary_union([g.buffer(0) for g in geoms])
        features.append({
            "type": "Feature",
            "properties": {"municipio": muni},
            "geometry": mapping(merged),
        })

    json.dump({"type": "FeatureCollection", "features": features},
              open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
    sizes = {f["properties"]["municipio"]: f["geometry"]["type"] for f in features}
    print(f"OK -> public/amb_municipios.geojson ({len(features)} municipios: {sizes})")


if __name__ == "__main__":
    main()
