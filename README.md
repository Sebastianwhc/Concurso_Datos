# 🦠 EcoSalud IA — Bucaramanga

### Simulador predictivo de dengue para el Área Metropolitana de Bucaramanga (AMB)

Desarrollo para la **Categoría Avanzado** del concurso **"Datos al Ecosistema 2026: IA para Colombia"** (Reto Salud y Bienestar). Combina **datos abiertos** (SIVIGILA, IDEAM, CDMB y GIS oficiales) con un **modelo de IA que corre en el navegador** para anticipar la evolución del dengue comuna por comuna, traducirlo a impacto económico y proponer acciones de control.

**Deploy:** https://concursodatos.vercel.app · **Bitácora del proyecto:** [`BITACORA.md`](BITACORA.md)

---

## 🎯 Las tres piezas del producto

1. **Landing / Storytelling** — presentación inmersiva (scrollytelling) que cuenta la historia del dengue en el territorio con datos reales.
2. **Dashboard histórico** — demografía, clínica, canal endémico, estratos, síntomas y mapas (Santander + AMB), con filtrado 100 % en cliente.
3. **Simulador predictivo (núcleo)** — mapa de riesgo por comuna + sliders de clima + modelo de IA que proyecta 16 semanas, con capa de alerta temprana, impacto económico y modo "tiempo real".

---

## 🏗️ Arquitectura en una frase

> **Sin backend.** Los datos pesados se procesan **offline en Python** y se publican como artefactos compactos en `public/data/`; el modelo se entrena en Python, se exporta a **ONNX** y se ejecuta **en el navegador** con `onnxruntime-web` (WebAssembly, CPU). Despliegue **estático** en Vercel.

Ver el detalle en [`docs/02_ARQUITECTURA.md`](docs/02_ARQUITECTURA.md).

## 🛠️ Stack

- **Frontend:** React + Vite + TypeScript.
- **Estado:** Zustand.
- **Visualización y mapas:** **ECharts** (gráficos y mapas coropléticos/burbujas, también en el simulador).
- **IA en el navegador:** `onnxruntime-web` (backend wasm CPU, `numThreads=1` → sin headers COOP/COEP, funciona offline).
- **Pipelines de datos / ML (offline):** Python — pandas, scikit-learn (`GradientBoostingRegressor`), `skl2onnx`, shapely.
- **Estilos:** CSS modular con design tokens y glassmorphism.

> Nota histórica: versiones tempranas exploraron Mapbox/deck.gl/Canvas/GSAP; la versión final usa **ECharts** para todo lo geoespacial y de gráficos. Esas dependencias quedaron sin uso.

---

## 📊 Datos (todos abiertos)

| Fuente | Uso | Artefacto |
|---|---|---|
| **SIVIGILA** (individual, Bucaramanga) | 28.626 casos, 76 variables, 2015–2025 | `public/data/dengue.json` |
| **SIVIGILA** (nacional) | dengue por municipio de Santander 2007–2022 | `public/data/santander_dengue.json` |
| **IDEAM + CDMB** | clima semanal 2007–2026 (precip, temp, humedad, PM2.5) | `public/data/clima_semanal.json` |
| **GIS oficial** (AMB, geoportal Floridablanca) | comunas de Bga (17) + Florida (8) | `public/amb_comunas.geojson` |
| Direcciones (Reporte Salud Pública) → geocodificadas | casos georreferenciados por comuna | `public/data/metro_puntos.json` |

Detalle completo, enlaces y licencias en [`docs/05_FUENTES_DATOS_ABIERTOS.md`](docs/05_FUENTES_DATOS_ABIERTOS.md).

---

## 📦 Instalación y desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
```

### Regenerar los artefactos de datos / modelo (opcional)

Los CSV crudos y el caché de geocodificación viven en `data/` y **no se versionan**. Para reconstruir los artefactos procesados:

```bash
# Datos
python scripts/build_dashboard_data.py      # -> dengue.json
python scripts/build_geo_data.py            # -> santander_dengue.json
python scripts/build_climate_data.py        # -> clima_semanal.json
python scripts/geocode_metro.py             # -> metro_puntos.json (primera vez ~2-3 h; luego usa caché)
python scripts/build_municipios_outline.py  # -> amb_municipios.geojson (requiere shapely)

# Modelo de IA
pip install -r ml/requirements.txt
python ml/build_training_table.py           # -> training_table.csv
python ml/train_model.py                     # -> public/data/model.onnx + model_meta.json
```

---

## 📚 Documentación técnica (`docs/`)

| Documento | Contenido |
|---|---|
| [`01_METODOLOGIA_CRISP-ML.md`](docs/01_METODOLOGIA_CRISP-ML.md) | el proyecto en las 6 fases de CRISP-ML(Q) |
| [`02_ARQUITECTURA.md`](docs/02_ARQUITECTURA.md) | arquitectura de la solución + diagramas |
| [`03_ANALISIS_DATOS_EDA.md`](docs/03_ANALISIS_DATOS_EDA.md) | análisis exploratorio con cifras reales |
| [`04_DIAGRAMAS_FLUJO.md`](docs/04_DIAGRAMAS_FLUJO.md) | diagramas de flujo (Mermaid) |
| [`05_FUENTES_DATOS_ABIERTOS.md`](docs/05_FUENTES_DATOS_ABIERTOS.md) | fuentes, enlaces y licencias |
| [`06_IMPACTO_ECONOMICO.md`](docs/06_IMPACTO_ECONOMICO.md) | cuánto cuesta el dengue y cuánto ahorra la herramienta |
| [`INFORME_SIMULADOR.md`](docs/INFORME_SIMULADOR.md) | cómo funciona el simulador (código) |
| [`INFORME_MATEMATICO.md`](docs/INFORME_MATEMATICO.md) | del dato crudo a la predicción, con fórmulas |

---

*Proyecto para el Reto de Salud y Bienestar — Datos al Ecosistema 2026, Colombia.*
