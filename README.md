# 🦠 EcoSalud IA — Bucaramanga

### Simulador predictivo de dengue para el Área Metropolitana de Bucaramanga (AMB)

Desarrollo para la **Categoría Avanzado** del concurso **"Datos al Ecosistema 2026: IA para Colombia"** (Reto Salud y Bienestar). Combina **datos abiertos** (SIVIGILA, IDEAM, CDMB y GIS oficiales) con un **modelo de IA que corre en el navegador** para anticipar la evolución del dengue comuna por comuna, traducirlo a impacto económico y proponer acciones de control.

**Deploy:** https://concursodatos.vercel.app

📘 **¿Primera vez aquí? Empieza por el [`DOCUMENTO_MAESTRO.md`](DOCUMENTO_MAESTRO.md)** — reúne toda la
información del proyecto (qué, cómo, para qué y en qué contexto funciona). Narrativa cronológica en
[`BITACORA.md`](BITACORA.md); hitos en [`CHANGELOG.md`](CHANGELOG.md).

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

> Nota histórica: versiones tempranas exploraron Mapbox/deck.gl para lo geoespacial; la versión final usa **ECharts** para todos los mapas y gráficos, por lo que esas dependencias se **eliminaron** del `package.json`. GSAP sí se usa (animaciones de la landing).

---

## 📊 Datos (todos abiertos)

| Fuente | Uso | Artefacto |
|---|---|---|
| **Registro individual de dengue — convenio FOSCAL** *(semiprivado)* | 28.626 casos, 76 variables, 2015–2025 | `public/data/dengue.json` |
| **SIVIGILA nacional** *(datos.gov.co `qzc7-jbg3`)* | dengue por municipio de Santander 2007–2022 | `public/data/santander_dengue.json` |
| **Boletín epidemiológico INS** | re-anclaje de la semilla a 2026 | `public/data/nowcast_2026.json` |
| **DANE — MGN 2018** | polígonos de municipios (Santander + AMB) | `public/santander_municipios.geojson` |
| **IDEAM + CDMB** | clima semanal 2007–2026 (precip, temp, humedad, PM2.5) | `public/data/clima_semanal.json` |
| **GIS oficial** (AMB, geoportal Floridablanca) | comunas de Bga (17) + Florida (8) | `public/amb_comunas.geojson` |
| Direcciones (registro FOSCAL) → geocodificadas (Nominatim/OSM) | casos georreferenciados por comuna | `public/data/metro_puntos.json` |

> **Nota:** `dengue.json` proviene de un **convenio con la FOSCAL** (semiprivado, no abierto); se publica
> solo agregado/anonimizado. El requisito de *datos abiertos* se cumple con el dataset nacional de
> datos.gov.co y las fuentes públicas (INS, DANE, IDEAM, CDMB, GIS).

Detalle completo, vista previa de cada archivo, enlaces y licencias en [`docs/05_FUENTES_DATOS_ABIERTOS.md`](docs/05_FUENTES_DATOS_ABIERTOS.md).

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
pip install -r requirements.txt             # deps Python (pipelines + ML)
python ml/build_training_table.py           # -> training_table.csv
python ml/train_model.py                     # -> public/data/model.onnx + model_meta.json
```

---

## 📚 Documentación técnica (`docs/`)

| Documento | Contenido |
|---|---|
| [`planteamiento_problema.md`](docs/planteamiento_problema.md) | problema, objetivos y alcance |
| [`01_METODOLOGIA_CRISP-ML.md`](docs/01_METODOLOGIA_CRISP-ML.md) | el proyecto en las 6 fases de CRISP-ML(Q) |
| [`02_ARQUITECTURA.md`](docs/02_ARQUITECTURA.md) | arquitectura de la solución + diagramas |
| [`03_ANALISIS_DATOS_EDA.md`](docs/03_ANALISIS_DATOS_EDA.md) | análisis exploratorio con cifras reales |
| [`04_DIAGRAMAS_FLUJO.md`](docs/04_DIAGRAMAS_FLUJO.md) | diagramas de flujo (Mermaid) |
| [`05_FUENTES_DATOS_ABIERTOS.md`](docs/05_FUENTES_DATOS_ABIERTOS.md) | fuentes, enlaces y licencias |
| [`06_IMPACTO_ECONOMICO.md`](docs/06_IMPACTO_ECONOMICO.md) | cuánto cuesta el dengue y cuánto ahorra la herramienta |
| [`data_dictionary.md`](docs/data_dictionary.md) | diccionario de variables (consolidado + tabla de entrenamiento) |
| [`CONTRATO_ARTEFACTOS.md`](docs/CONTRATO_ARTEFACTOS.md) | estructura de los artefactos JSON (equivalente a la API) |
| [`public_impact_assessment.md`](docs/public_impact_assessment.md) | impacto, ética, privacidad y mitigación de sesgos |
| [`validacion_guide.md`](docs/validacion_guide.md) | guía para que pares reproduzcan los resultados |
| [`conclusiones.md`](docs/conclusiones.md) | hallazgos, limitaciones y próximos pasos |
| [`INFORME_SIMULADOR.md`](docs/INFORME_SIMULADOR.md) | cómo funciona el simulador (código) |
| [`INFORME_MATEMATICO.md`](docs/INFORME_MATEMATICO.md) | del dato crudo a la predicción, con fórmulas |

**Licencia:** [MIT](LICENSE) — código y datos abiertos.

---

*Proyecto para el Reto de Salud y Bienestar — Datos al Ecosistema 2026, Colombia.*
