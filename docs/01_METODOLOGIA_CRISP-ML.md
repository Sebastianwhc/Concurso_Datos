# 🔬 Metodología — CRISP-ML(Q)

> Cómo se organizó el proyecto **EcoSalud IA** siguiendo **CRISP-ML(Q)** (*Cross-Industry Standard Process for Machine Learning with Quality assurance*), la evolución de CRISP-DM para proyectos de Machine Learning.
> Cada fase incluye su **quality gate**: el criterio que tuvo que cumplirse para avanzar.
> Documentos hermanos: [`02_ARQUITECTURA.md`](02_ARQUITECTURA.md) · [`03_ANALISIS_DATOS_EDA.md`](03_ANALISIS_DATOS_EDA.md) · [`INFORME_MATEMATICO.md`](INFORME_MATEMATICO.md).

---

## Las 6 fases (mapa)

```
1. Comprensión del   →  2. Comprensión y    →  3. Ingeniería de   →  4. Modelado y
   negocio y datos       preparación de         features              evaluación
   (scope + viabilidad)  datos (EDA, ETL)       (tabla c×s×clima)      (GBM → validación)
                                                                            │
        6. Monitoreo y   ◄──  5. Despliegue   ◄──────────────────────────────┘
           mantenimiento       (ONNX en navegador, Vercel)
```

CRISP-ML(Q) es **iterativo**: el hallazgo de la fase 4 (*"el clima solo no predice"*) obligó a volver a la fase 3 y rediseñar las features hacia un enfoque **autoregresivo**. Esa iteración es el corazón metodológico del proyecto.

---

## Fase 1 — Comprensión del negocio y de los datos

**Objetivo de negocio.** El dengue es endémico en el Área Metropolitana de Bucaramanga (AMB) y epidémico por ciclos. En el brote de 2024, Santander fue el 3.er departamento con más casos del país. La autoridad sanitaria necesita **anticipar dónde y cuándo** se concentrará la transmisión para focalizar el control vectorial (fumigación, eliminación de criaderos, alerta a IPS) **antes** del pico.

**Pregunta de ML.** *¿Cómo podría evolucionar el dengue, comuna por comuna del AMB, en las próximas 16 semanas, bajo un escenario climático dado?*

**Criterios de éxito.**
| Dimensión | Criterio |
|---|---|
| Negocio | priorizar comunas en riesgo y traducir a impacto económico accionable |
| ML | superar de forma clara un baseline climatológico en validación **temporal** |
| Operación | correr **sin backend**, robusto en demo en vivo (offline), costo de hosting ≈ $0 |

**Inventario de datos** (todos abiertos): SIVIGILA individual (Bucaramanga), SIVIGILA nacional, direcciones para geocodificar, clima IDEAM + CDMB, y GIS oficial de comunas. Detalle en [`05_FUENTES_DATOS_ABIERTOS.md`](05_FUENTES_DATOS_ABIERTOS.md).

> **✅ Quality gate 1:** problema accionable + datos abiertos suficientes (>10.000 filas, +20 variables, integración clima-salud) + viabilidad técnica sin backend. **Superado.**

---

## Fase 2 — Comprensión y preparación de los datos

**EDA** (detalle en [`03_ANALISIS_DATOS_EDA.md`](03_ANALISIS_DATOS_EDA.md)): 28.626 casos de Bucaramanga (2015–2025, 76 variables); perfil de severidad 68,4 % ambulatorio / 31,0 % hospitalizado / 0,57 % grave; fuerte estacionalidad anual; heterogeneidad por comuna; brote 2024 (11.541 casos) como evento clave.

**Preparación (ETL offline en Python, `scripts/`):**
- **Decodificación** del SIVIGILA individual (códigos, mojibake, 21 síntomas en bitmask) → `dengue.json`.
- **Agregación** del nacional (2,46 M filas) a Santander por municipio → `santander_dengue.json`.
- **Geocodificación** de direcciones (Nominatim + caché + fallbacks) y asignación a comuna por *point-in-polygon* → 6.703/8.365 casos ubicados (80 %).
- **Unificación climática** IDEAM + CDMB a serie semanal ISO, con corrección de altitud de la temperatura (+2,2 °C) y climatología por semana.
- **Disolución GIS** de comunas en contorno por municipio (shapely `unary_union`).

> Decisión arquitectónica clave: el CSV nacional de 218 MB **nunca llega al navegador**; solo viajan artefactos compactos a `public/data/`.

> **✅ Quality gate 2:** datos limpios, trazables y compactos; supuestos de calidad declarados como *caveats* (profundidad temporal asimétrica, geocodificación a nivel de calle, Girón sin comunas abiertas). **Superado.**

---

## Fase 3 — Ingeniería de features

Se construye **una sola matriz** `X ∈ ℝ^(N×16)` con `N = 10.267` filas (**comuna × semana**) y objetivo `y` = casos. Detalle matemático en [`INFORME_MATEMATICO.md`](INFORME_MATEMATICO.md) §2.

| Grupo | Features | Idea |
|---|---|---|
| Estacionales (3) | `semana`, `sin52`, `cos52` | tiempo cíclico (semana 52 ≈ semana 1) |
| Estáticas/comuna (3) | `incidencia_base`, `log_pob`, `es_floridablanca` | riesgo y tamaño por comuna |
| Clima (6) | `precip/temp/humedad` + ventanas de 8 semanas | clima actual y rezagado (ciclo del mosquito) |
| **Autoregresivas (4)** | `casos_l1/l2/l3`, `casos_ma4` | **inercia epidémica** (la señal fuerte) |

- **Objetivo transformado:** `log1p(casos)` (comprime la cola de los brotes); el frontend revierte con `expm1`.
- **Desagregación espacial de Bucaramanga:** la curva de la ciudad se reparte entre comunas por *share* geocodificado (Floridablanca usa conteo real).

> **✅ Quality gate 3:** features reproducibles **idénticas** en Python (entrenamiento) y TypeScript (inferencia), garantizadas por `feature_order` en `model_meta.json`. **Superado.**

---

## Fase 4 — Modelado y evaluación

**Modelo:** `GradientBoostingRegressor` (sklearn) — *pronóstico autoregresivo + clima modulador*. Hiperparámetros: `n_estimators=400`, `max_depth=4`, `learning_rate=0.04`, `subsample=0.85`, `min_samples_leaf=20`. Se eligió GBR (y no XGBoost) porque `skl2onnx` lo exporta **fiel** a ONNX (verificado: `max|sklearn − ONNX| ≈ 1e-6`).

**Validación temporal (no aleatoria):** train ≤ 2023, test 2024–2025 (**año epidémico** = prueba dura).

| Modelo | MAE | RMSE | R² |
|---|---|---|---|
| Baseline (climatología) | 7,36 | 12,01 | **−0,36** |
| GBM (AR + clima) | **2,99** | **6,74** | **+0,571** |

**El hallazgo que cambió el diseño.** Un modelo entrenado **solo con clima** da R² ≈ −0,49 (peor que la media). La señal predictiva fuerte es la **inercia epidémica** (importancia por permutación dominada por `casos_l*`). De ahí la iteración hacia un modelo **autoregresivo con el clima como modulador** — coherente con cómo operan los sistemas reales de alerta temprana.

**Ablación (debida diligencia).** Se probaron pérdida **Poisson** y una feature de **contagio espacial**; ninguna mejora el R² (Poisson lo empeora; el contagio espacial es ruido por la desagregación por *share*). El modelo actual es el mejor de las variantes — el techo está en el **dato**, no en el algoritmo. Ver `INFORME_MATEMATICO.md` §4.6 y `ml/experiment_model.py`.

> **✅ Quality gate 4:** el modelo supera el baseline de forma clara **en validación temporal sobre un brote**, y el comportamiento es honesto y explicable. **Superado.**

---

## Fase 5 — Despliegue

- **Exportación a ONNX** (~372 KB) + `model_meta.json` (orden de features, semilla, rangos de clima, métricas).
- **Inferencia en el navegador** con `onnxruntime-web` (wasm CPU, `numThreads=1` → sin COOP/COEP). El motor `forecast.ts` replica el feature-engineering y proyecta de forma **recursiva** 16 semanas (1 inferencia/semana, batch de 25 comunas).
- **Ciclo predicción → acción:** capa de alerta por incidencia + recomendaciones de control, traducción a pesos y modo "tiempo real" (Open-Meteo).
- **Hosting estático** en Vercel; el wasm se versiona para garantizar funcionamiento **offline**.

Detalle en [`02_ARQUITECTURA.md`](02_ARQUITECTURA.md) e [`INFORME_SIMULADOR.md`](INFORME_SIMULADOR.md).

> **✅ Quality gate 5:** build verde (`tsc -b && vite build`); simulador validado numéricamente contra el mismo ONNX en Python. **Pendiente:** verificar carga del wasm en **producción** (Vercel).

---

## Fase 6 — Monitoreo y mantenimiento

- **Reentrenamiento:** al llegar nuevos datos SIVIGILA/clima se corre `build_training_table.py` + `train_model.py`; la semilla y los rangos se regeneran solos.
- **Robustez ante drift de clima:** el modo "tiempo real" acota el clima al rango del modelo y cae a sliders manuales si la API falla.
- **Trazabilidad:** cada artefacto en `public/data/` se regenera de forma determinista desde los scripts (mismo `random_state=42`).
- **Riesgo conocido (drift):** la profundidad temporal asimétrica (Floridablanca 2023–2025) implica vigilar su desempeño conforme entren más datos.

> **✅/⏳ Quality gate 6:** proceso de regeneración documentado y determinista. **Pendiente operativo:** no hay aún un piloto en producción con la autoridad sanitaria (tope estructural de la rúbrica de Impacto).

---

## Resumen en una tabla

| Fase CRISP-ML(Q) | Qué se hizo | Quality gate |
|---|---|---|
| 1. Negocio + datos | scope, pregunta de ML, inventario de datos abiertos | ✅ |
| 2. Datos | EDA + ETL offline en Python → artefactos compactos | ✅ |
| 3. Features | matriz comuna×semana (16 features), `log1p` | ✅ |
| 4. Modelado | GBM AR+clima, validación temporal, R²=0,571 | ✅ |
| 5. Despliegue | ONNX en navegador, alerta + economía, Vercel | ✅ (falta verificar prod) |
| 6. Monitoreo | reentrenamiento determinista, manejo de drift | ✅ proceso / ⏳ piloto real |
