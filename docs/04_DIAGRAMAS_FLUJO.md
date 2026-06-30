# 🔀 Diagramas de flujo

> Los procesos del proyecto como diagramas (Mermaid). Cinco flujos: **datos**, **entrenamiento**, **inferencia en el navegador**, **ciclo predicción→acción** y **estados de la app**.
> Contexto: [`02_ARQUITECTURA.md`](02_ARQUITECTURA.md) · [`INFORME_MATEMATICO.md`](INFORME_MATEMATICO.md).

---

## 1. Pipeline de datos (ETL offline)

De los cinco datasets crudos a los artefactos que consume el navegador.

```mermaid
flowchart TD
    subgraph CRUDO["📥 Datos crudos (data/ · NO versionado)"]
        S1["SIVIGILA individual Bga<br/>28.626 × 76 · 2015–2025"]
        S2["SIVIGILA nacional<br/>2,46 M filas · 218 MB"]
        S3["Direcciones<br/>(Reporte Salud Pública)"]
        S4["IDEAM (precip/hum diario, temp mensual)"]
        S5["CDMB (horario 2025)"]
        S6["GIS comunas<br/>(AMB + Floridablanca)"]
    end

    S1 --> P1["build_dashboard_data.py<br/>decodifica · bitmask síntomas"]
    S2 --> P2["build_geo_data.py<br/>filtra Santander · agrega"]
    S3 --> P3["geocode_metro.py<br/>Nominatim + caché + point-in-polygon"]
    S6 --> P3
    S4 --> P4["build_climate_data.py<br/>unifica a semana ISO · +2,2°C altitud"]
    S5 --> P4
    S6 --> P5["build_municipios_outline.py<br/>unary_union (disuelve comunas)"]

    P1 --> A1["dengue.json"]
    P2 --> A2["santander_dengue.json"]
    P3 --> A3["metro_puntos.json<br/>comunas_casos.json"]
    P4 --> A4["clima_semanal.json"]
    P5 --> A5["amb_municipios.geojson"]

    A1 & A3 & A4 --> P6["build_training_table.py<br/>tabla comuna × semana × clima"]
    P6 --> A6["training_table.csv<br/>10.267 filas"]
```

---

## 2. Entrenamiento del modelo (`ml/train_model.py`)

```mermaid
flowchart TD
    T0["training_table.csv<br/>(comuna × semana, 10.267 filas)"] --> T1["Imputar faltantes (mediana)"]
    T1 --> T2["Construir features AR<br/>shift(1/2/3) + rolling(4) por comuna"]
    T2 --> T3{"Split temporal"}
    T3 -->|"año ≤ 2023"| TR["TRAIN"]
    T3 -->|"año ≥ 2024 (brote)"| TE["TEST"]

    TR --> M1["GradientBoostingRegressor<br/>n_estimators=400 · depth=4 · lr=0.04<br/>target = log1p(casos)"]
    M1 --> M2["Evaluar en TEST<br/>MAE/RMSE/R² vs baseline climatológico"]
    M2 --> M3{"¿Supera baseline?"}
    M3 -->|"R²=+0.571 vs −0.36 ✅"| M4["Reentrenar con TODOS los datos"]
    M3 -->|"no"| TX["volver a features (iterar)"]

    M4 --> X1["Exportar a ONNX (skl2onnx)"]
    X1 --> X2["Self-check fidelidad<br/>max|sklearn − ONNX| ≈ 1e-6 ✅"]
    X2 --> O1["model.onnx (~372 KB)"]
    M4 --> O2["model_meta.json<br/>feature_order · comunas · seed · ranges · metrics"]
```

> El **split temporal** (entrenar con el pasado, probar con el brote futuro) es deliberadamente exigente: evita "ver el futuro" y demuestra que el modelo **generaliza al brote**.

---

## 3. Inferencia recursiva en el navegador (`forecast.ts`)

El modelo predice **una** semana; se encadena para proyectar **16**.

```mermaid
flowchart TD
    I0["Cargar model.onnx + meta<br/>(InferenceSession, 1 vez)"] --> I1["hist[comuna] = seed<br/>(últimos 4 casos reales)"]
    I1 --> LOOP{"semana k = 1 … 16"}

    LOOP --> F1["Por comuna: leer del historial<br/>l1, l2, l3, ma4"]
    F1 --> F2["Estacional: semana avanza (mod 52)<br/>→ sin52, cos52"]
    F2 --> F3["Estáticas: incidencia_base, log_pob, es_florida"]
    F3 --> F4["Clima del escenario (sostenido)<br/>precip_acum8 = precip·8 · *_mean8 = valor"]
    F4 --> F5["Tensor [25 comunas × 16 features]"]
    F5 --> F6["onnxruntime-web: session.run"]
    F6 --> F7["casos = max(0, expm1(salida))"]
    F7 --> F8["hist[comuna].push(casos)<br/>↩ realimenta semana k+1"]
    F8 --> LOOP

    LOOP -->|"fin"| R1["porComuna[id] = [16 semanas]<br/>totalSemana[k] = suma AMB"]
```

> Costo: **16 inferencias** de un batch de 25 filas = milisegundos. Por eso mover un slider recalcula el mapa casi al instante.

---

## 4. Ciclo predicción → acción (lo que ve el usuario)

```mermaid
flowchart LR
    SC["Escenario de clima<br/>(sliders o 'tiempo real' Open-Meteo)"] --> PR["Pronóstico 16 sem<br/>por comuna"]
    PR --> MAP["🗺️ Mapa de riesgo<br/>(visualMap por comuna)"]
    PR --> AL["🚨 Alerta temprana<br/>incidencia/10.000 hab<br/>alto≥3 · medio≥1,5 · vigilancia≥0,7"]
    AL --> AC["✅ Acciones priorizadas<br/>fumigación · criaderos · alerta IPS"]
    PR --> EC["💰 Traducción a pesos<br/>casos × ~$1,39 M COP<br/>ahorro con acción temprana (−20%)"]
    MAP & AC & EC --> DEC["Decisión de salud pública<br/>(focalizar antes del pico)"]
```

> Cierra el ciclo: el pronóstico no termina en un número, sino en **dónde fumigar** y **cuánto se ahorra**.

---

## 5. Estados de la interfaz del simulador

```mermaid
stateDiagram-v2
    [*] --> Cargando: montar vista
    Cargando --> Listo: meta + geojson + sesión ONNX ok
    Listo --> Recalculando: cambia clima (debounce 180ms)
    Recalculando --> Listo: pronóstico actualizado
    Listo --> Reproduciendo: play
    Reproduciendo --> Reproduciendo: semana++ (cada 850ms)
    Reproduciendo --> Listo: pausa / fin (sem 16)
    Listo --> TiempoReal: toggle 'tiempo real'
    TiempoReal --> Listo: Open-Meteo falla → sliders manuales
```

---

## Cómo se renderizan estos diagramas

Son bloques **Mermaid**: GitHub los renderiza nativamente en el `.md`. Para el informe impreso se pueden exportar a PNG/SVG con [mermaid.live](https://mermaid.live) o la CLI `@mermaid-js/mermaid-cli` (`mmdc -i 04_DIAGRAMAS_FLUJO.md -o diagramas.pdf`).
