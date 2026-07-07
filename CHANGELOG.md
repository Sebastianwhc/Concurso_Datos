# Changelog

Registro cronológico de los hitos del proyecto **EcoSalud IA — Simulador Predictivo de Dengue (AMB)**.
Formato inspirado en [Keep a Changelog](https://keepachangelog.com/). Fechas en formato `AAAA-MM-DD`.
La narrativa detallada de cada iteración vive en [`BITACORA.md`](BITACORA.md).

---

## [Unreleased] — Preparación para la sustentación (2026-07-06)

### Added
- **Simulador — consulta puntual por comuna + semana:** nuevo panel en el motor predictivo donde se **elige una comuna** (25, agrupadas por municipio) y una **semana proyectada** (16), y muestra sus **casos e incidencia**, la **tendencia**, su **mini-trayectoria** de 16 semanas con marcador, y la **recomendación de control específica** para esa comuna.
- **Landing — sección visual "Datos abiertos"** (`SourcesSection.tsx`, tras el Territorio): 6 tarjetas de fuentes (datos.gov.co, boletín INS, DANE, IDEAM/CDMB, geoportales AMB, registro FOSCAL) con etiqueta ABIERTO/CONVENIO + franja de tratamiento. Da respaldo visual a la parte 3 del pitch.
- **`docs/GUION_PITCH.md`** — guion del pitch (15 min) mapeado a la landing, con tiempos, Q&A y checklist.
- **`DOCUMENTO_MAESTRO.md`** — documento único con toda la información del proyecto (qué, cómo, para qué y en qué contexto funciona).
- **Fuentes con enlaces reales + vista previa de cada artefacto** en `docs/05_FUENTES_DATOS_ABIERTOS.md`: dataset nacional datos.gov.co (`qzc7-jbg3`), boletín INS, geografía DANE (MGN 2018).

### Fixed
- **Atribución de fuentes corregida (honestidad):** `dengue.json` proviene de un **convenio con la Clínica FOSCAL** (semiprivado), **no** es dato abierto; el requisito de *datos abiertos* del concurso se cumple con el dataset nacional de datos.gov.co y las fuentes públicas (INS, DANE, IDEAM, CDMB, GIS). Se añadió el **DANE (MGN)** como fuente formal (la base geográfica de Santander/AMB sí proviene del DANE).
- **`LICENSE`** (MIT), **`requirements.txt`** y **`environment.yml`** consolidados en la raíz.
- **`docs/`**: `planteamiento_problema.md`, `conclusiones.md`, `data_dictionary.md`, `public_impact_assessment.md`, `validacion_guide.md`, `CONTRATO_ARTEFACTOS.md`.
- **CI** (`.github/workflows/ci.yml`) — lint + build en cada push/PR.

### Changed
- **Landing — año de referencia corregido (evita subvender la amenaza):** la sección "La Amenaza" pasa de titular con el **2025 parcial** (2.418 casos, corte en agosto) al **brote completo de 2024** (11.541 casos, muestra robusta para demografía/clínica). Se añade la **situación vigente 2026** con el **dato real del boletín INS** (1.098 casos, a S22), y se refuerza la credibilidad indicando que el brote 2024 lo confirman FOSCAL y el boletín. La landing ahora carga `nowcast_2026.json`.
- **Rendimiento de la landing (macOS):** los 3 sistemas de partículas (Hero, CTA, Simulador) se pausan fuera de viewport vía `IntersectionObserver`; el Hero reduce partículas 120→70 y elimina el conteo O(n²) de conexiones.
- **Precisión de textos de cara al jurado:** en la landing, "telemetría climática en tiempo real de la CDMB" → "variables climáticas (IDEAM / CDMB)"; footer con fuentes completas (SIVIGILA · IDEAM · CDMB · INS).
- **Consistencia del modelo:** etiqueta corregida a `GradientBoostingRegressor` (antes decía "HistGradientBoosting") en `train_model.py` y `model_meta.json`.

### Removed
- Dependencias sin uso: `deck.gl`, `@deck.gl/layers`, `@deck.gl/react`, `mapbox-gl`, `react-map-gl` (exploradas en versiones tempranas; la versión final usa **ECharts** para todo lo geoespacial). Se añadió `tslib` como dependencia explícita de `echarts-for-react`.
- Componente muerto `SolutionSection.tsx` (no referenciado).

---

## 2026-06-30 — Re-anclaje a 2026 + pulido de presentación

### Added
- **Nowcasting 2026** (`scripts/build_nowcast_seed.py` → `nowcast_2026.json`): re-ancla la semilla autoregresiva a **2026-S22** usando el boletín del INS (Bucaramanga real 2026; Floridablanca estimada por fracción validada). Frontera honesta *observado → estimado → pronóstico*.
- **Panel "Situación 2026 · Santander"** (`Situacion2026.tsx`) y **backtest del brote 2024** (`Backtest2024.tsx`) en el simulador.
- Dashboard segmentado (2026 boletín INS vs. 2015–2025 SIVIGILA individual); gráfico de régimen de afiliación; canal endémico con bandas neón.
- Documentación técnica: `01_METODOLOGIA_CRISP-ML.md`, `02_ARQUITECTURA.md`, `03_ANALISIS_DATOS_EDA.md`, `04_DIAGRAMAS_FLUJO.md`, `05_FUENTES_DATOS_ABIERTOS.md`.

### Changed
- Landing alineada con el modelo real: "LSTM" → "Gradient Boosting · ONNX"; "87% confianza" → "R²=0,57 (validación brote 2024)".

---

## 2026-06-18 — Integración de las ramas del equipo

### Added
- **Landing storytelling** (rama `daniela`): 8 actos narrativos; `ThreatSection` y `TerritorySection` con datos reales SIVIGILA; `TransitionSection`.
- **Sección de contacto + footer global** (rama `feat/seccion-contacto`).

---

## Iteraciones previas — Núcleo del producto

### Added
- **Simulador predictivo** (`src/features/simulator/`): pronóstico autoregresivo 16 semanas 100 % en navegador (`onnxruntime-web`, wasm CPU), mapa de riesgo por comuna (ECharts), sliders de clima, capa de alerta temprana + recomendaciones, traducción a impacto económico y **modo "tiempo real"** (Open-Meteo).
- **Modelo de IA** (`ml/`): `GradientBoostingRegressor` entrenado sobre tabla comuna×semana×clima (10.267 filas) y exportado a ONNX. Validación temporal en el brote 2024–2025: **R²=0,571 · MAE 2,99** (baseline R²=−0,36).
- **Dashboard histórico** (`src/features/dashboard/`): KPIs, 6 gráficos ECharts, sección geoespacial (Santander + AMB), panel Clima vs Dengue. Filtrado 100 % en cliente.
- **Pipelines de datos** (`scripts/`): decodificación SIVIGILA individual (28.626 casos, 76 variables), agregación nacional, clima semanal 2007–2026 (IDEAM+CDMB), geocodificación de casos por comuna.
