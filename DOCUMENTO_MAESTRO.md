# 📘 Documento Maestro — EcoSalud IA
### Simulador Predictivo de Dengue para el Área Metropolitana de Bucaramanga (AMB)

**Concurso:** Datos al Ecosistema 2026 · IA para Colombia — **Categoría Avanzado** · Reto **Salud y Bienestar**
**Repositorio:** https://github.com/Sebastianwhc/Concurso_Datos · **Deploy:** https://concursodatos.vercel.app
**Última actualización:** 2026-07-06

> Este documento reúne **toda** la información del proyecto: qué se hizo, cómo se hizo, para qué se hizo,
> **en qué contexto técnico funciona** y **sobre qué contexto de datos opera**. Es la puerta de entrada;
> cada sección enlaza al documento técnico detallado correspondiente en [`docs/`](docs/).

---

## 1. Resumen ejecutivo

**EcoSalud IA** es una aplicación web que **anticipa la evolución del dengue** en el Área Metropolitana de
Bucaramanga, **comuna por comuna y semana a semana**, usando exclusivamente **datos abiertos**. Combina
vigilancia epidemiológica (SIVIGILA), clima (IDEAM/CDMB) y geografía oficial (GIS) con un **modelo de IA
que corre dentro del navegador** (ONNX + WebAssembly, sin backend). No se queda en la predicción: la
traduce en **recomendaciones de control vectorial priorizadas** y en **impacto económico en pesos**,
cerrando el ciclo **predicción → acción → impacto**.

El producto tiene **tres piezas**:
1. **Landing / Storytelling** — narrativa inmersiva en 8 actos que lleva al jurado del problema a la solución.
2. **Dashboard histórico** — demografía, clínica, canal endémico, estratos, síntomas y mapas del AMB.
3. **Simulador predictivo (núcleo)** — mapa de riesgo + sliders de clima + pronóstico a 16 semanas + alerta + economía + modo tiempo real.

**Cifra de credibilidad:** en validación temporal honesta contra el **brote real de 2024–2025**, el modelo
logra **R² = 0,571 · MAE = 2,99** frente a un baseline de R² = −0,36.

---

## 2. Para qué se hizo (el problema)

El dengue es la principal arbovirosis de Colombia y una carga recurrente en el AMB. Su transmisión depende
del clima y sigue patrones espaciales que se repiten. El problema operativo es que la respuesta sanitaria es
**reactiva**: se actúa cuando el brote ya es visible en las cifras, cuando la ventana de control más
costo-efectiva ya se cerró.

> **Pregunta que resuelve el proyecto:** ¿podemos anticipar, con datos abiertos, hacia dónde va el dengue en
> el AMB —por comuna y por semana— para pasar de una respuesta **reactiva** a una **preventiva**?

Planteamiento completo, objetivos y alcance en **[`docs/planteamiento_problema.md`](docs/planteamiento_problema.md)**.

---

## 3. Qué se construyó (las tres piezas)

### 3.1 Landing / Storytelling — `src/features/landing/`
Experiencia de *scrollytelling* en **8 actos** narrativos, alimentada con datos reales SIVIGILA:

🔴 La amenaza → 🔥 La historia del brote → 👥 Las personas → 🏥 El impacto clínico → 🌐 Transición →
🗺️ El territorio → 💰 El impacto económico → 🤖 La solución → 🏁 Cierre.

Su objetivo es que el jurado comprenda **progresivamente**: qué ocurre, cómo evolucionó, a quién afecta,
qué cuesta y cómo se anticipa. Optimizada para rendimiento en macOS (partículas pausadas fuera de viewport).

### 3.2 Dashboard histórico — `src/features/dashboard/`
- **Dos segmentos con su *porqué* explícito:** **2026 · Bucaramanga** (boletín INS: canal endémico, tendencia,
  KPIs) y **2015–2025 · SIVIGILA individual** (demografía y clínica, que requieren registro por caso).
- **KPIs:** casos, hospitalizados, dengue grave, letalidad.
- **6 gráficos ECharts:** canal endémico semanal (bandas históricas), tendencia anual, pirámide edad×sexo,
  clasificación clínica, estrato, régimen de afiliación y prevalencia de síntomas.
- **Sección geoespacial:** coropleto de Santander (2007–2022) + comunas del AMB con burbujas de casos.
- **Panel Clima vs Dengue:** casos semanales vs. lluvia y temperatura (doble eje), reactivo a los filtros.
- **Filtrado 100 % en cliente** (multi-selección) y **responsive** (sidebar off-canvas en móvil).

Cifras del EDA en **[`docs/03_ANALISIS_DATOS_EDA.md`](docs/03_ANALISIS_DATOS_EDA.md)**.

### 3.3 Simulador predictivo (núcleo) — `src/features/simulator/`
- **Mapa de riesgo por comuna** (ECharts) con zoom/arrastre fluido (una sola serie: relleno de comunas +
  contorno de municipios disuelto).
- **Sliders de clima** (precipitación, temperatura, humedad) que definen un escenario sostenido.
- **Pronóstico autoregresivo recursivo a 16 semanas**, calculado **en el navegador** con el modelo ONNX.
- **Capa de alerta temprana:** clasifica cada comuna por **incidencia semanal** (casos/10.000 hab; umbrales
  alto ≥ 3 / medio ≥ 1,5 / vigilancia ≥ 0,7) y genera **acciones de control** priorizadas.
- **Traducción a pesos:** costo proyectado del horizonte y **ahorro potencial con acción temprana (~−20 %)**.
- **Modo "Tiempo real":** consume el clima real de Bucaramanga vía **Open-Meteo** (API abierta, sin key).
- **Anclas verificables:** panel "Situación 2026 · Santander" y **backtest ciego del brote 2024**.

Detalle de implementación en **[`docs/INFORME_SIMULADOR.md`](docs/INFORME_SIMULADOR.md)**.

---

## 4. Cómo funciona — arquitectura (**en qué contexto técnico opera**)

> **Arquitectura en una frase:** *sin backend.* Los datos pesados se procesan **offline en Python** y se
> publican como artefactos compactos en `public/data/`; el modelo se entrena en Python, se exporta a **ONNX**
> y se ejecuta **en el navegador** con `onnxruntime-web` (WebAssembly, CPU). Despliegue **estático** en Vercel.

```
┌─────────────────────────┐        ┌──────────────────────────┐        ┌─────────────────────────┐
│   MUNDO OFFLINE (Python) │        │  ARTEFACTOS (public/data)│        │   NAVEGADOR (React/TS)  │
│                          │        │                          │        │                         │
│  scripts/  → datos       │  ───▶  │  dengue.json (~820 KB)   │  ───▶  │  Dashboard (ECharts)    │
│  ml/       → modelo      │        │  model.onnx  (~372 KB)   │        │  Simulador (onnxruntime)│
│  (pandas, sklearn,       │        │  nowcast_2026.json       │        │  Landing (storytelling) │
│   skl2onnx, shapely)     │        │  *.geojson, clima, …     │        │                         │
└─────────────────────────┘        └──────────────────────────┘        └─────────────────────────┘
     se ejecuta una vez              se versionan en el repo               corre 100 % en cliente
```

**Por qué este diseño (contexto de ejecución):**
- **Robustez en demo en vivo:** al no depender de servidor ni de WiFi, la sustentación no se cae. El modelo
  se carga como asset `.wasm` (`numThreads=1` → sin headers COOP/COEP) y funciona **offline**.
- **Reproducibilidad:** el CSV nacional de 218 MB **nunca** llega al navegador; solo viajan artefactos
  agregados y anonimizados.
- **Costo cero de infraestructura:** despliegue estático, sin base de datos ni API que mantener.

El "contrato" entre el mundo Python y el navegador (estructura de cada artefacto) está en
**[`docs/CONTRATO_ARTEFACTOS.md`](docs/CONTRATO_ARTEFACTOS.md)**. Diagramas de arquitectura y despliegue en
**[`docs/02_ARQUITECTURA.md`](docs/02_ARQUITECTURA.md)** y de flujo en **[`docs/04_DIAGRAMAS_FLUJO.md`](docs/04_DIAGRAMAS_FLUJO.md)**.

### Stack tecnológico
| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite + TypeScript |
| Estado | Zustand |
| Visualización y mapas | **ECharts** (gráficos + coropletos/burbujas + mapa del simulador) |
| IA en el navegador | **`onnxruntime-web`** (backend wasm CPU) |
| Pipelines / ML (offline) | Python — pandas, scikit-learn (`GradientBoostingRegressor`), skl2onnx, shapely |
| Estilos | CSS modular con design tokens + glassmorphism |
| Despliegue | Vercel (estático) · CI: GitHub Actions (lint + build) |

---

## 5. Sobre qué datos opera (**el contexto de datos**)

Todos los datos son **abiertos**. Trazabilidad, enlaces y licencias en
**[`docs/05_FUENTES_DATOS_ABIERTOS.md`](docs/05_FUENTES_DATOS_ABIERTOS.md)**; variables en
**[`docs/data_dictionary.md`](docs/data_dictionary.md)**.

| Fuente | Uso | Artefacto |
|--------|-----|-----------|
| **SIVIGILA** individual (Bucaramanga) | 28.626 casos · 76 variables · 2015–2025 | `dengue.json` |
| **SIVIGILA** nacional | dengue por municipio de Santander (87 mun.) 2007–2022 | `santander_dengue.json` |
| **IDEAM + CDMB** | clima semanal 2007–2026 (precip, temp, humedad, PM2.5) | `clima_semanal.json` |
| **GIS oficial** (AMB, Floridablanca) | comunas: Bga 17 + Florida 8 | `amb_comunas.geojson` |
| Direcciones (Reporte Salud Pública) → geocodificadas | casos por comuna (80 % geocodificados) | `metro_puntos.json` |
| **Boletín epidemiológico INS** | re-anclaje de la semilla a 2026 | `nowcast_2026.json` |

**Requisitos del concurso cubiertos:** +10.000 filas ✅ (28.626) · +20 variables ✅ (76) · datos abiertos ✅ ·
integración clima+salud ✅ · IA predictiva avanzada ✅ · repo público ✅.

---

## 6. Cómo se hizo el modelo de IA (**el corazón**)

Documento matemático completo (datos → features → modelo → validación → pronóstico, con fórmulas):
**[`docs/INFORME_MATEMATICO.md`](docs/INFORME_MATEMATICO.md)**.

**Enfoque:** *pronóstico autoregresivo + clima como modulador*.
- **Datos de entrenamiento:** tabla **comuna × semana** (10.267 filas), con clima rezagado/acumulado,
  estacionalidad cíclica, población e incidencia base (ver diccionario §2).
- **Modelo:** `GradientBoostingRegressor` (sklearn; `n_estimators=400, max_depth=4, learning_rate=0.04,
  subsample=0.85, min_samples_leaf=20`). Se eligió sobre XGBoost porque **skl2onnx lo exporta fiel a ONNX**.
- **Target:** `log1p(casos)`; el frontend aplica `expm1` a la salida. **16 features** en orden fijo,
  replicadas byte a byte entre Python y `forecast.ts`.
- **Validación temporal honesta:** train ≤ 2023, **test 2024–2025** (el año epidémico, la prueba dura).
  Resultado: **R² = 0,571 · MAE = 2,99** (baseline R² = −0,36). El modelo **generaliza al brote**.
- **Backtest ciego del brote 2024:** arrancando en 2024-S8 con clima real, reproduce la trayectoria
  ascendente (subestima el pico ~17 %; conservador pero correcto en dirección y magnitud).
- **Exportación:** ONNX ~372 KB, **verificado fiel** al modelo sklearn (diff < 1e-6).

**Hallazgo clave (honesto):** el clima por sí solo **no** predice el dengue (R² = −0,49); la señal está en la
**inercia epidémica** (casos recientes). El clima es **modulador, no motor** — así funcionan los sistemas de
alerta reales. La ablación (Poisson, contagio espacial) confirmó que **el techo está en el dato**
(Bga desagregada por *share*), no en el algoritmo.

---

## 7. Del pronóstico a la acción y al dinero

El simulador **no se detiene en la curva**:
1. **Predicción** → 16 semanas por comuna (1 inferencia ONNX por semana, batch de 25 comunas).
2. **Acción** → clasificación por incidencia semanal + recomendaciones de control priorizadas (fumigación
   focalizada, eliminación de criaderos, alerta a IPS) con tendencia ↑/↓/–.
3. **Impacto** → costo proyectado en COP (costo medio por caso ≈ **$1,39 M**, ponderado con nuestras
   proporciones reales 68 % ambulatorio / 31 % hospitalizado / 0,57 % grave) y **ahorro con acción temprana
   (~−20 %)**. Metodología en **[`docs/06_IMPACTO_ECONOMICO.md`](docs/06_IMPACTO_ECONOMICO.md)**.

---

## 8. Re-anclaje a 2026 (nowcasting verificable)

Un modelo autoregresivo necesita **casos recientes como semilla**, pero el dato municipal detallado se corta
en 2025-S35. Para presentar en 2026 sin que el horizonte caiga en el pasado, la semilla se **re-ancla a
2026-S22** con el **boletín del INS**:
- Se calibra la fracción `f_Bga = Bga/Santander = 0,304` en el solape 2024–2025.
- Aplicada al Santander 2026, **reproduce el Bucaramanga real 2026 con −11,2 % de error** → valida el método
  antes de estimar Floridablanca (`f_Florida = 0,119`).
- La frontera **observado → estimado → pronóstico** se muestra explícitamente en la UI.

---

## 9. Estructura del repositorio

> **Nota de honestidad estructural.** La [estructura sugerida](Sugerencia_EstructuraRepositorio_Avanzado.txt)
> es una plantilla genérica para una plataforma de datos grande (con `agents/`, `kubernetes/`, `docker/`,
> `serverless/`, etc.). Este proyecto es una **app web estática con pipeline Python offline**, así que se
> adopta la estructura **en espíritu**, mapeando cada elemento a lo que el proyecto realmente usa. **No se
> fabrican** carpetas de infraestructura que el proyecto no emplea (Kubernetes, contenedores, agentes LLM):
> incluirlas vacías engañaría al jurado y restaría rigor. Lo que sí aporta valor —documentación de
> evaluación, licencia, changelog, CI real, diccionario de datos, evaluación de impacto— **sí** se añadió.

```
Concurso_Datos/
├── README.md                     # ficha técnica y guía
├── DOCUMENTO_MAESTRO.md          # este documento
├── BITACORA.md                   # narrativa cronológica detallada
├── CHANGELOG.md                  # hitos por versión
├── LICENSE                       # MIT
├── requirements.txt / environment.yml   # deps Python (pipelines + ML)
├── package.json                  # deps y scripts del frontend
├── .github/workflows/ci.yml      # CI: lint + build
│
├── docs/                         # documentación técnica y de evaluación
│   ├── planteamiento_problema.md          ├── 01_METODOLOGIA_CRISP-ML.md
│   ├── conclusiones.md                     ├── 02_ARQUITECTURA.md
│   ├── data_dictionary.md                  ├── 03_ANALISIS_DATOS_EDA.md
│   ├── public_impact_assessment.md         ├── 04_DIAGRAMAS_FLUJO.md
│   ├── validacion_guide.md                 ├── 05_FUENTES_DATOS_ABIERTOS.md
│   ├── CONTRATO_ARTEFACTOS.md (≈api_spec)  ├── 06_IMPACTO_ECONOMICO.md
│   ├── INFORME_MATEMATICO.md               └── 07_BRIEF_NARRATIVA_ECONOMICA.md
│   └── INFORME_SIMULADOR.md
│
├── ml/                           # modelo (≈ src/train.py + models/ de la plantilla)
│   ├── build_training_table.py   ├── train_model.py   ├── experiment_model.py
│   └── data/  (training_table.csv, metrics.json, comuna_features.json)
│
├── scripts/                      # pipelines de datos (≈ src/data_pipeline/)
│   ├── build_dashboard_data.py   ├── build_geo_data.py   ├── build_climate_data.py
│   ├── geocode_metro.py          ├── build_municipios_outline.py
│   └── build_nowcast_seed.py     └── build_backtest_2024.py
│
├── public/                       # artefactos servidos (≈ data/processed + models/)
│   ├── data/*.json  (dengue, clima, model.onnx, model_meta, nowcast_2026, backtest_2024, …)
│   └── *.geojson    (comunas, municipios, metropolitana)
│
└── src/                          # frontend React (≈ la capa de aplicación)
    ├── features/landing/   ├── features/dashboard/   ├── features/simulator/
    ├── layout/   ├── styles/   └── App.tsx / main.tsx

# data/ (CSV crudos, 218 MB) → NO versionado (.gitignore); se regenera con scripts/
```

**Mapeo con la plantilla sugerida:** `src/data_pipeline/` → `scripts/` · `src/train.py` + `models/` → `ml/` ·
`data/processed/` → `public/data/` · `api_spec.md` → `docs/CONTRATO_ARTEFACTOS.md` (no hay REST; el contrato
son los JSON) · `notebooks/` → los scripts de `scripts/`+`ml/` cumplen esa función de forma reproducible ·
`deployments/docker+k8s` → **no aplica** (despliegue estático en Vercel).

---

## 10. Cómo correr

```bash
# App web (no requiere Python)
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build

# Regenerar datos y modelo (opcional; requiere los CSV crudos en data/)
pip install -r requirements.txt
python scripts/build_dashboard_data.py     # -> dengue.json
python scripts/build_climate_data.py       # -> clima_semanal.json
python ml/build_training_table.py          # -> training_table.csv
python ml/train_model.py                    # -> public/data/model.onnx + model_meta.json
python scripts/build_nowcast_seed.py       # -> nowcast_2026.json (semilla 2026-S22)
```
Guía de verificación paso a paso en **[`docs/validacion_guide.md`](docs/validacion_guide.md)**.

---

## 11. Resultados, límites y ética

- **Métricas:** R² = 0,571 · MAE = 2,99 (test brote 2024–2025); baseline R² = −0,36; validación del
  re-anclaje −11,2 %. Modelo ONNX fiel a 1e-6.
- **Limitaciones declaradas** (profundidad temporal asimétrica, desagregación por *share*, Girón sin comunas,
  geocodificación a nivel de calle): **[`docs/conclusiones.md`](docs/conclusiones.md)**.
- **Ética, privacidad y sesgos** (datos anonimizados y agregados; el modelo no usa variables sensibles como
  predictores): **[`docs/public_impact_assessment.md`](docs/public_impact_assessment.md)**.

---

## 12. Metodología y trazabilidad

- **Marco:** CRISP-ML(Q), con *quality gates* por fase → **[`docs/01_METODOLOGIA_CRISP-ML.md`](docs/01_METODOLOGIA_CRISP-ML.md)**.
- **Bitácora completa** de cada decisión e iteración → **[`BITACORA.md`](BITACORA.md)**.
- **Historial de cambios** → **[`CHANGELOG.md`](CHANGELOG.md)**.

---

## 13. Próximos pasos

Conteos reales por comuna (el mayor salto posible) · piloto operativo con una autoridad sanitaria ·
extensión a Girón/Piedecuesta · optimización del bundle · **publicar el "Uso" en `datos.gov.co/usos`**
(puerta de elegibilidad del concurso).

---

*Proyecto para el Reto de Salud y Bienestar — Datos al Ecosistema 2026, Colombia. Código y datos abiertos (MIT).*
