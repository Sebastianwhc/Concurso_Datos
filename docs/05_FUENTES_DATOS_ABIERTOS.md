# 🗂️ Fuentes de datos abiertos

> Evidencia de que **EcoSalud IA** se construye sobre **datos abiertos**: qué fuente, para qué se usó, en qué artefacto terminó y bajo qué licencia.
> Requisito clave del concurso (peso 20/100). Acompaña a [`03_ANALISIS_DATOS_EDA.md`](03_ANALISIS_DATOS_EDA.md) y [`02_ARQUITECTURA.md`](02_ARQUITECTURA.md).

---

## 1. Tabla maestra de fuentes

| # | Fuente | Entidad | Tipo de dato | Cobertura | Enlace |
|---|---|---|---|---|---|
| 1 | **SIVIGILA** — vigilancia individual de dengue | INS / Secretaría de Salud de Bucaramanga | casos individuales (76 variables) | Bucaramanga, 2015–2025 | [datos.gov.co](https://www.datos.gov.co) · [SIVIGILA / INS](https://www.ins.gov.co/Direcciones/Vigilancia/Paginas/SIVIGILA.aspx) |
| 2 | **SIVIGILA** — nacional (dengue) | INS | casos agregables por municipio | Colombia, 2007–2022 | [datos.gov.co](https://www.datos.gov.co) |
| 3 | **Direcciones** (Reporte Salud Pública) | Secretaría de Salud (AMB) | direcciones de notificación | AMB, 2023–2025 | reporte oficial → geocodificado con [Nominatim/OSM](https://nominatim.org) |
| 4 | **IDEAM** — clima histórico | IDEAM | precipitación, humedad (diario), temperatura (mensual) | Santander, 2007–2026 | [dhime.ideam.gov.co](http://dhime.ideam.gov.co) |
| 5 | **CDMB** — telemetría ambiental | CDMB | precip/temp/humedad/PM2.5 (horario) | AMB, 2025 | [cdmb.gov.co](https://www.cdmb.gov.co) |
| 6 | **GIS comunas Bucaramanga** | AMB / IDESC GIS | polígonos de 17 comunas | Bucaramanga | geoportal GIS oficial AMB |
| 7 | **GIS comunas Floridablanca** | Alcaldía de Floridablanca | polígonos de 8 comunas | Floridablanca | geoportal Floridablanca |
| 8 | **Open-Meteo** (runtime, opcional) | Open-Meteo | clima en tiempo real (API) | Bucaramanga | [open-meteo.com](https://open-meteo.com) |

> Los enlaces a `datos.gov.co` son los portales de origen; los conjuntos exactos del SIVIGILA se descargan desde el catálogo del INS / Datos Abiertos Colombia. Verificar y fijar el **DOI/URL del dataset específico** antes de la sustentación.

---

## 2. Trazabilidad: de la fuente al artefacto

| Fuente(s) | Script de procesamiento | Artefacto publicado (`public/`) |
|---|---|---|
| 1 | `scripts/build_dashboard_data.py` | `data/dengue.json` |
| 2 | `scripts/build_geo_data.py` | `data/santander_dengue.json` |
| 3 (+6,7) | `scripts/geocode_metro.py` | `data/metro_puntos.json`, `data/comunas_casos.json` |
| 4 + 5 | `scripts/build_climate_data.py` | `data/clima_semanal.json` |
| 6 + 7 | (composición GIS) + `scripts/build_municipios_outline.py` | `amb_comunas.geojson`, `amb_municipios.geojson` |
| derivados | `ml/build_training_table.py` → `ml/train_model.py` | `data/model.onnx`, `data/model_meta.json` |
| 8 | `src/features/simulator/liveWeather.ts` | (consumo en vivo, no se persiste) |

> **Frontera de datos:** las fuentes crudas viven en `data/` y **no se versionan** (`.gitignore`); solo los artefactos procesados llegan a `public/`. Cualquiera puede regenerarlos con los scripts (ver `README.md`).

---

## 3. Licencias y condiciones de uso

| Fuente | Licencia / condición | Nota |
|---|---|---|
| SIVIGILA / INS (datos.gov.co) | Datos abiertos del Estado colombiano (Ley 1712 de 2014) | uso libre con atribución a la fuente |
| IDEAM | Datos abiertos / información pública | atribución IDEAM |
| CDMB | Información pública ambiental | atribución CDMB |
| GIS AMB / Floridablanca | Geoportales públicos oficiales | atribución a la entidad |
| Nominatim / OpenStreetMap | **ODbL** | atribución "© OpenStreetMap contributors"; respetar *usage policy* (1 req/s, caché) |
| Open-Meteo | Libre para uso no comercial (CC-BY 4.0) | sin API key; atribución a Open-Meteo |

> **Pendiente formal:** confirmar la licencia exacta de cada conjunto en su ficha de `datos.gov.co` y citarla en el informe final. El uso aquí es de investigación/educativo, sin redistribuir microdatos individuales identificables.

---

## 4. Cumplimiento de los requisitos del concurso

| Requisito | Cómo se cumple | Evidencia |
|---|---|---|
| **+10.000 filas** | 28.626 casos (solo Bucaramanga) | fuente 1 → `dengue.json` |
| **+20 variables** | 76 columnas | fuente 1 |
| **Datos abiertos** | datos.gov.co / IDEAM / CDMB / GIS oficiales | fuentes 1–7 |
| **Integración clima + salud** | clima semanal procesado + panel Clima vs Dengue + modelo | fuentes 4,5 + 1 |
| **Fuentes en tiempo real** (nivel Avanzado) | modo "tiempo real" vía Open-Meteo | fuente 8 |
| **Código y datos reproducibles** | scripts deterministas + artefactos versionados | `scripts/`, `ml/`, `public/data/` |

---

## 5. Privacidad y ética

- Se trabaja con **conteos y agregados**; no se publican microdatos individuales identificables.
- La geocodificación se hace a **nivel de calle** (no de vivienda) y los casos se **agregan por comuna/burbuja**, evitando ubicar pacientes.
- El modelo y los artefactos publicados (`public/`) no contienen información personal: son curvas, polígonos y parámetros del modelo.

---

## 6. Pendiente para la elegibilidad (puerta del concurso)

> ⚠️ **Publicar el "Uso" en** [`herramientas.datos.gov.co/usos`](https://herramientas.datos.gov.co/usos) — sin este registro la propuesta **no se evalúa**. Debe enlazar los conjuntos de datos abiertos usados (fuentes 1–5 de esta tabla).
