# Diccionario de Datos

Definición de las variables de los dos artefactos centrales del proyecto:
el **consolidado epidemiológico** (dashboard) y la **tabla de entrenamiento** (modelo).
Fuentes y licencias en [`05_FUENTES_DATOS_ABIERTOS.md`](05_FUENTES_DATOS_ABIERTOS.md).

---

## 1. Consolidado del registro individual de dengue — `public/data/dengue.json`

> **Origen:** registro **individual** de dengue obtenido por **convenio con la Clínica FOSCAL** (Santander),
> de **carácter semiprivado** — no es un dato abierto. Solo se publica esta versión **agregada y
> anonimizada** (sin identificadores). Ver [`05_FUENTES_DATOS_ABIERTOS.md`](05_FUENTES_DATOS_ABIERTOS.md) §4.

Formato **columnar** (arreglo de filas de enteros + diccionarios de códigos), para que
28.626 casos × 12 campos pesen ~820 KB en el navegador. Decodificado desde el registro individual
(76 variables originales, 2015–2025) por `scripts/build_dashboard_data.py`.
El índice de cada columna está en `COL` de [`src/features/dashboard/dengue.ts`](../src/features/dashboard/dengue.ts).

| # | Variable | Tipo | Descripción | Codificación |
|---|----------|------|-------------|--------------|
| 0 | `anio` | int | Año de notificación | 2015–2025 |
| 1 | `semana` | int | Semana epidemiológica | 1–53 |
| 2 | `sexo` | cat | Sexo del paciente | índice → `meta.dicts.sexo` (0=F, 1=M) |
| 3 | `edad` | cat | Grupo etario | índice → `meta.dicts.edad` |
| 4 | `estrato` | cat | Estrato socioeconómico | índice → `meta.dicts.estrato` |
| 5 | `regimen` | cat | Régimen de afiliación en salud | índice → `meta.dicts.regimen` (Contributivo, Subsidiado…) |
| 6 | `severidad` | cat | Clasificación clínica | 0=sin signos, 1=con signos de alarma, 2=grave |
| 7 | `tipo_caso` | cat | Tipo de caso (probable/confirmado…) | índice → `meta.dicts.tipo_caso` |
| 8 | `hosp` | bin | Hospitalización | 1=hospitalizado, 0=ambulatorio |
| 9 | `fallecido` | bin | Desenlace fatal | 1=fallecido, 0=vivo |
| 10 | `sintomas` | bitmask | 21 síntomas en un entero (bit *i* = síntoma *i*) | ver `meta.symptoms` |
| 11 | `municipio` | cat | Municipio de residencia | índice → `meta.dicts.municipio` (0=Bucaramanga) |

**Metadatos (`meta`):** `total`, `years[]`, `source`, `dicts{}` (tablas de decodificación) y `symptoms[]` (nombres de los 21 síntomas del bitmask).

---

## 2. Tabla de entrenamiento del modelo — `ml/data/training_table.csv`

Grano **comuna × semana** (10.267 filas). Generada por `ml/build_training_table.py`.
Es la entrada del `GradientBoostingRegressor`. El orden exacto de las 16 features está en
`FEATURES` de [`ml/train_model.py`](../ml/train_model.py) y se replica en el navegador en `forecast.ts`.

### Variables estáticas / de contexto
| Variable | Tipo | Descripción |
|----------|------|-------------|
| `semana` | int | Semana epidemiológica (1–53) |
| `sin52`, `cos52` | float | Codificación cíclica de la estacionalidad anual (seno/coseno de la semana) |
| `incidencia_base` | float | Incidencia histórica de referencia de la comuna |
| `log_pob` | float | `log(población)` de la comuna |
| `es_floridablanca` | bin | 1 si la comuna es de Floridablanca, 0 si es de Bucaramanga |

### Variables climáticas (modulador)
| Variable | Tipo | Descripción |
|----------|------|-------------|
| `precip` | float | Precipitación de la semana |
| `temp` | float | Temperatura media de la semana |
| `humedad` | float | Humedad relativa de la semana |
| `precip_acum8` | float | Precipitación acumulada de las 8 semanas previas (rezago del vector) |
| `temp_mean8` | float | Temperatura media móvil de 8 semanas |
| `humedad_mean8` | float | Humedad media móvil de 8 semanas |

### Variables autoregresivas (motor del pronóstico)
| Variable | Tipo | Descripción |
|----------|------|-------------|
| `casos_l1`, `casos_l2`, `casos_l3` | float | Casos de la comuna 1, 2 y 3 semanas atrás |
| `casos_ma4` | float | Media móvil de casos de las 4 semanas previas |

### Objetivo
| Variable | Tipo | Descripción |
|----------|------|-------------|
| `casos` | float | **Target.** Casos de dengue de la comuna en la semana. Se entrena sobre `log1p(casos)`; el frontend aplica `expm1` a la salida ONNX. |

---

## 3. Otros artefactos publicados (`public/data/`)

| Archivo | Grano | Contenido |
|---------|-------|-----------|
| `santander_dengue.json` | municipio × año | Dengue por municipio de Santander (87 mun., 2007–2022) |
| `clima_semanal.json` | semana | Serie climática 2007–2026 (precip, temp, humedad, PM2.5) + climatología |
| `comunas_casos.json` | comuna | Casos geocodificados agregados por comuna |
| `metro_puntos.json` | ubicación | Casos georreferenciados (agregados por punto) del AMB |
| `model.onnx` + `model_meta.json` | — | Modelo entrenado + metadatos (features, semilla, rangos de clima, métricas) |
| `nowcast_2026.json` | comuna | Semilla re-anclada a 2026-S22 (frontera observado/estimado/pronóstico) |
| `backtest_2024.json` | semana | Pronóstico ciego del brote 2024 vs. curva real |

El contrato de estructura de cada JSON está en [`CONTRATO_ARTEFACTOS.md`](CONTRATO_ARTEFACTOS.md).
