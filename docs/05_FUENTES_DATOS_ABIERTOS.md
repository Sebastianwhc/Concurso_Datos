# 🗂️ Fuentes de datos

> Evidencia de las fuentes sobre las que se construye **EcoSalud IA**: qué fuente, para qué se usó, en
> qué artefacto terminó y bajo qué condición de uso. Acompaña a
> [`03_ANALISIS_DATOS_EDA.md`](03_ANALISIS_DATOS_EDA.md) y [`02_ARQUITECTURA.md`](02_ARQUITECTURA.md).
>
> ⚠️ **Nota de honestidad sobre "datos abiertos":** el registro **individual** de dengue (`dengue.json`,
> 28.626 casos) **no es un dato abierto**: se obtuvo por **convenio institucional con la Clínica FOSCAL**
> (carácter semiprivado). El requisito de *datos abiertos* del concurso se cumple con el **dataset nacional
> de datos.gov.co** (fuente 2) y las fuentes 3–10. Ver §4.

---

## 1. Tabla maestra de fuentes

| # | Fuente | Entidad | Tipo de dato | Cobertura | Enlace / acceso |
|---|---|---|---|---|---|
| 1 | **Registro individual de dengue (SIVIGILA)** — *semiprivado* | **Clínica FOSCAL** (Santander) | casos individuales (76 variables) | AMB, 2015–2025 | **Convenio institucional** con la FOSCAL (no es dato abierto) |
| 2 | **Dengue, dengue grave y mortalidad por municipio** (SIVIGILA nacional) | INS · Datos Abiertos Colombia | casos por municipio | Colombia, 2007–2022 | [datos.gov.co · `qzc7-jbg3`](https://www.datos.gov.co/Salud-y-Protecci-n-Social/13-Dengue-Dengue-grave-y-mortalidad-por-dengue-mun/qzc7-jbg3/about_data) |
| 3 | **Boletín Epidemiológico Semanal** | INS | agregados semanales (Santander; Bga 2026) | 2024–2026 | [ins.gov.co · Boletín Epidemiológico](https://www.ins.gov.co/buscador-eventos/Paginas/Vista-Boletin-Epidemilogico.aspx) |
| 4 | **Geografía municipal — Marco Geoestadístico Nacional (MGN)** | **DANE** | polígonos de municipios/depto. (2018) | Colombia / Santander | [Geovisor DANE (ArcGIS)](https://experience.arcgis.com/experience/5416979d97fc44ca9830954856784b35/page/PáginaConVMovil?views=Vista-Históricos) |
| 5 | **IDEAM** — clima histórico | IDEAM | precipitación, humedad (diario), temperatura (mensual) | Santander, 2007–2026 | [dhime.ideam.gov.co](http://dhime.ideam.gov.co) *(estaciones Palonegro y Mogotes)* |
| 6 | **CDMB** — telemetría ambiental | CDMB | precip/temp/humedad/PM2.5 (horario) | AMB, 2025 | [cdmb.gov.co](https://www.cdmb.gov.co) *(URL exacta del portal por confirmar)* |
| 7 | **GIS comunas Bucaramanga** | AMB / IDESC GIS | polígonos de 17 comunas | Bucaramanga | geoportal GIS oficial AMB *(URL por confirmar)* |
| 8 | **GIS comunas Floridablanca** | Alcaldía de Floridablanca | polígonos de 8 comunas | Floridablanca | geoportal Floridablanca *(URL por confirmar)* |
| 9 | **Nominatim / OpenStreetMap** (herramienta) | OSM | geocodificación de direcciones | AMB | [nominatim.org](https://nominatim.org) |
| 10 | **Open-Meteo** (runtime, opcional) | Open-Meteo | clima en tiempo real (API) | Bucaramanga | [open-meteo.com](https://open-meteo.com) |

> Las **direcciones** que se geocodifican (→ `metro_puntos.json`) provienen del mismo registro individual
> (fuente 1, FOSCAL) / Reporte de Salud Pública del AMB; se procesan con la herramienta 9.

---

## 2. Vista preliminar de cada artefacto (qué contiene y de dónde viene)

| Artefacto | Viene de (fuente) | Estructura + muestra real |
|---|---|---|
| **`dengue.json`** · 877 KB | 1 — FOSCAL (semiprivado) | `{meta, columns, rows}` columnar · `rows[0]=[2015,1,1,3,0,0,1,1,1,0,459,0]` (28.626 × 12) |
| **`santander_dengue.json`** · 16 KB | 2 — datos.gov.co `qzc7-jbg3` | `{meta, municipios}` · `municipios[0]={code:"001",name:"Bucaramanga",total:40425,graves:4187,byYear}` |
| **`clima_semanal.json`** · 81 KB | 5+6 — IDEAM + CDMB | `{meta, weekly, climatologia}` · `weekly[0]={anio:2007,semana:1,precip:0.0,temp:22.4,humedad:68.7,pm25:null}` |
| **`comunas_casos.json`** · 1 KB | 1 + 7 (geocod.) | `{meta, byComuna}` · `byComuna["3"]={total:47,byYear:{2024:37,2025:8,2023:2}}` |
| **`metro_puntos.json`** · 158 KB | 1 + 9 (Nominatim) | `{meta, points}` · `points[0]=[-73.10288,7.08055,1,1]`=`[lon,lat,casos,municipio]` (6.703/8.365) |
| **`nowcast_2026.json`** · 18 KB | 3 — Boletín INS (+ derivado) | `{ancla:{2026,22}, calibracion:{f_bga:0.3038, error_pct:-11.2, f_florida:0.1191}, seed, series}` |
| **`backtest_2024.json`** · 1 KB | derivado (ONNX + clima real) | `{ancla:{2024,8}, horizonte:16, ciudad:"Bucaramanga", weeks, real, forecast, metrics}` |
| **`model.onnx`** · 372 KB | entrenado (`ml/`) | binario · GBR · 16 features → `log1p(casos)` |
| **`model_meta.json`** · 10 KB | entrenado (`ml/`) | `{feature_order[16], target_transform:"log1p", clima_ranges, comunas, seed, metrics, reanclaje_2026}` |
| **`ml/data/training_table.csv`** · 1,4 MB | deriva de 1–8 | 10.268 filas × 26 cols · `[comuna,municipio,anio,semana,casos,pob,…,temp_mean8,humedad_mean8]` |
| **`ml/data/comuna_features.json`** · 5 KB | 7,8 + población | `comunas[0]={id:"B1",municipio:"Bucaramanga",nombre:"Comuna Norte",pob:66710,incidencia_base:0.24}` |
| **`ml/data/metrics.json`** · 1 KB | salida del entrenamiento | `{baseline:{R2:-0.36}, modelo:{MAE:2.989,R2:0.571}, importancia:[casos_l1:0.36,…]}` |
| **`amb_comunas.geojson`** · 283 KB | 7+8 — GIS AMB/Florida | 25 features (Polygon) · `props={id:"B1",municipio:"Bucaramanga",comuna:"Comuna Norte"}` |
| **`bucaramanga_comunas.geojson`** · 110 KB | 7 — GIS AMB | 15 features · `props={COD_COMUNA:"1",NOMBRE_COM:"Comuna Norte",POBLACION:66710}` |
| **`amb_municipios.geojson`** · 110 KB | derivado (disuelto de comunas) | 2 features · `props={municipio:"Bucaramanga"}` (contorno de ciudad) |
| **`amb_metropolitana.geojson`** · 3 KB | 4 — **DANE MGN** | 4 features · `props={MPIO_CNMBR:"GIRÓN",MPIO_CCNCT:"68307",…}` |
| **`santander_municipios.geojson`** · 62 KB | 4 — **DANE MGN** | 87 features · `props={MPIO_CNMBR:"AGUADA",MPIO_CCNCT:"68013",…}` |

---

## 3. Trazabilidad: de la fuente al artefacto

| Fuente(s) | Script de procesamiento | Artefacto publicado (`public/`) |
|---|---|---|
| 1 | `scripts/build_dashboard_data.py` | `data/dengue.json` |
| 2 | `scripts/build_geo_data.py` | `data/santander_dengue.json` |
| 1 (+7,8) | `scripts/geocode_metro.py` (Nominatim) | `data/metro_puntos.json`, `data/comunas_casos.json` |
| 5 + 6 | `scripts/build_climate_data.py` | `data/clima_semanal.json` |
| 4 | (geovisor DANE) | `santander_municipios.geojson`, `amb_metropolitana.geojson` |
| 7 + 8 | (composición GIS) + `scripts/build_municipios_outline.py` | `amb_comunas.geojson`, `amb_municipios.geojson` |
| 3 | `scripts/build_nowcast_seed.py` | `data/nowcast_2026.json` |
| derivados | `ml/build_training_table.py` → `ml/train_model.py` | `data/model.onnx`, `data/model_meta.json` |
| 10 | `src/features/simulator/liveWeather.ts` | (consumo en vivo, no se persiste) |

> **Frontera de datos:** las fuentes crudas viven en `data/` y **no se versionan** (`.gitignore`); solo los
> artefactos procesados y anonimizados llegan a `public/`.

---

## 4. Condiciones de uso y licencias

| Fuente | Condición de uso | Nota |
|---|---|---|
| **1. FOSCAL (registro individual)** | **Convenio institucional · semiprivado** | **No es dato abierto.** Uso autorizado para este proyecto; solo se publican **agregados anonimizados** (nunca microdatos identificables). |
| 2. Dengue municipal (datos.gov.co) | Datos abiertos del Estado (Ley 1712 de 2014) | uso libre con atribución al INS |
| 3. Boletín INS | Información pública | atribución INS |
| 4. DANE MGN | Datos abiertos / información pública | atribución DANE — Marco Geoestadístico Nacional 2018 |
| 5. IDEAM | Datos abiertos / información pública | atribución IDEAM |
| 6. CDMB | Información pública ambiental | atribución CDMB |
| 7–8. GIS AMB / Floridablanca | Geoportales públicos oficiales | atribución a la entidad |
| 9. Nominatim / OSM | **ODbL** | "© OpenStreetMap contributors"; respetar *usage policy* (1 req/s, caché) |
| 10. Open-Meteo | Libre no comercial (CC-BY 4.0) | sin API key; atribución a Open-Meteo |

---

## 5. Cumplimiento de los requisitos del concurso

| Requisito | Cómo se cumple | Evidencia |
|---|---|---|
| **+10.000 filas de datos abiertos** | Dataset **nacional de datos.gov.co** (`qzc7-jbg3`): millones de registros de dengue por municipio | fuente 2 → `santander_dengue.json` |
| **+20 variables** | 76 columnas en el registro individual | fuente 1 |
| **Datos abiertos** | datos.gov.co (2), INS (3), DANE (4), IDEAM (5), CDMB (6), GIS (7,8) | fuentes 2–8 |
| **Integración clima + salud** | clima semanal procesado + panel Clima vs Dengue + modelo | fuentes 5,6 + 1,2 |
| **Fuentes en tiempo real** (nivel Avanzado) | modo "tiempo real" vía Open-Meteo | fuente 10 |
| **Código y datos reproducibles** | scripts deterministas + artefactos versionados | `scripts/`, `ml/`, `public/data/` |

> **Aclaración estratégica:** la **profundidad analítica** (demografía, clínica, síntomas, geocodificación
> por comuna) se apoya en el registro individual de la **FOSCAL** (fuente 1, semiprivado). El **cumplimiento
> formal de "datos abiertos"** descansa en el dataset nacional de datos.gov.co (fuente 2) y las fuentes
> públicas 3–8. Ambos planos se declaran abiertamente para no confundir al jurado.

---

## 6. Privacidad y ética

- Se trabaja con **conteos y agregados**; **no** se publican microdatos individuales identificables, ni
  siquiera los del registro FOSCAL (que se usa solo para producir estadísticas y features agregadas).
- La geocodificación se hace a **nivel de calle** (no de vivienda) y los casos se **agregan por
  comuna/burbuja**, evitando ubicar pacientes.
- Los artefactos publicados en `public/` (curvas, polígonos, parámetros del modelo) no contienen
  información personal. Detalle en [`public_impact_assessment.md`](public_impact_assessment.md).

---

## 7. Pendiente para la elegibilidad (puerta del concurso)

> ⚠️ **Publicar el "Uso" en** [`herramientas.datos.gov.co/usos`](https://herramientas.datos.gov.co/usos) —
> sin este registro la propuesta **no se evalúa**. Debe enlazar los conjuntos de **datos abiertos** usados
> (fuente 2 de datos.gov.co como mínimo; idealmente también INS, DANE, IDEAM).

### Enlaces aún por confirmar
- **CDMB** (fuente 6): URL exacta del portal de calidad del aire / telemetría.
- **GIS comunas Bucaramanga** (fuente 7) y **Floridablanca** (fuente 8): URL de los geoportales/capas.
- **IDEAM** (fuente 5): enlace directo a las estaciones Palonegro y Mogotes (opcional).
