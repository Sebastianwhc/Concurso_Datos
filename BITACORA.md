# 📓 Bitácora — EcoSalud IA · Simulador Predictivo de Dengue (AMB)

**Concurso:** Datos al Ecosistema 2026 · Categoría Avanzado · Reto Salud y Bienestar
**Repo:** https://github.com/Sebastianwhc/Concurso_Datos · **Deploy:** https://concursodatos.vercel.app
**Última actualización:** 2026-06-30

---

## 🎯 Visión del producto (3 piezas)
1. **Landing / Storytelling** — presentación inmersiva para los jurados.
2. **Dashboard histórico** — demografía, clínica, canal endémico y mapas.
3. **Simulador predictivo (core)** — heatmap por comuna + sliders de clima + modelo IA.

## 🏗️ Decisiones de arquitectura
- **Sin backend.** Todo corre en el navegador; deploy estático en Vercel.
- **Modelo de IA en el navegador (ONNX).** Se entrena offline en Python y se exporta a ONNX → inferencia con `onnxruntime-web` (backend **wasm CPU**, `numThreads=1` → sin headers COOP/COEP). El binario `.wasm` y su glue `.mjs` viven en `src/features/simulator/ortwasm/` y se cargan con `?url` (Vite los emite como assets; no se puede importar desde `node_modules/.../dist` por el campo `exports`, ni desde `/public` porque el dev server rechaza el `import()` dinámico de `.mjs`). Robustez en demo en vivo: no depende de servidor ni WiFi.
- **Pipelines offline en Python** → artefactos compactos en `public/data/`. El CSV nacional de 218 MB **nunca** llega al navegador.
- **Escala metropolitana:** Bucaramanga ancla (dataset profundo), Floridablanca y Girón se suman para la capa espacial.
- Stack: React + Vite + TS, ECharts (gráficos y **mapas**, también en el simulador), `onnxruntime-web`, Zustand. (deck.gl/mapbox quedaron como dependencias sin uso final.)

---

## ✅ Lo que se ha hecho

### Datos y pipelines (`scripts/`)
- **`build_dashboard_data.py`** → `dengue.json`: decodifica el SIVIGILA individual de Bucaramanga (**28.626 registros, 76 variables, 2015–2025**) a formato columnar (códigos SIVIGILA, mojibake, 21 síntomas en bitmask). ~820 KB.
- **`build_geo_data.py`** → `santander_dengue.json`: agrega el archivo nacional (2.46M filas) a dengue por municipio de Santander (**87 municipios, 2007–2022**).
- **`geocode_metro.py`** → `metro_puntos.json` + `comunas_casos.json`: geocodifica direcciones (Nominatim + caché + fallbacks) y asigna comuna por point-in-polygon. **6.703 / 8.365 casos geocodificados (80%)**: Bucaramanga 475, Floridablanca 5.500, Girón 728 (2023–2025).
- **`build_climate_data.py`** → `clima_semanal.json`: unifica IDEAM (precip/humedad diarios, temp mensual) + CDMB (horario 2025) en **serie semanal 2007–2026** (precip, temp, humedad, PM2.5). Temp del valle = Palonegro 2007–2019 + Mogotes corregido por altitud (+2.2°C) 2020–2026. Incluye climatología por semana.
- **Geojson de comunas** (fuentes GIS oficiales, en `public/`): Bucaramanga 17 (AMB GIS) + Floridablanca 8 (geoportal Floridablanca) → `amb_comunas.geojson`. Girón: no publica comunas abiertas.
- **`build_municipios_outline.py`** → `amb_municipios.geojson`: disuelve las comunas en un polígono por municipio (shapely `unary_union`) para dibujar el **contorno de cada ciudad** en el simulador sin las líneas internas de comuna.

### Dashboard (`src/features/dashboard/`)
- **Filtros** como tarjetas desplegables con **multi-selección** (año, sexo, severidad, estrato, hospitalización). Filtrado 100% en cliente.
- **KPIs**: casos, hospitalizados, dengue grave, fallecidos/letalidad.
- **6 gráficos ECharts**: canal endémico semanal, tendencia anual, pirámide edad×sexo, clasificación clínica, estrato, prevalencia de síntomas.
- **Sección geoespacial** (al final):
  - **Santander** — coropleto por municipio (2007–2022) con bordes nítidos y nombre al hover.
  - **Área Metropolitana** — comunas de Bga (17) y Florida (8) como base tintada por ciudad + **burbujas de casos** (agregadas por ubicación, tamaño ∝ nº de casos), filtro de año, tooltip con nombre de comuna. Girón como burbujas.
- **Panel Clima vs Dengue** — casos semanales vs. lluvia y temperatura (doble eje), reacciona a los filtros. Integración multicausal visible.
- **Responsive** (móvil): sidebar off-canvas, grillas y filtros adaptados.

### Modelo de IA (`ml/`)
- **`build_training_table.py`** → `training_table.csv`: tabla **comuna × semana × clima + features** (10.267 filas). Bga desagregada por share espacial; Florida geocodificada real; clima rezagado/acumulado, estacionalidad, población, incidencia base.
- **`train_model.py`** → `public/data/model.onnx` + `model_meta.json`: **GradientBoosting (sklearn)** — *pronóstico autoregresivo + clima modulador*. Target `log1p(casos)` (frontend aplica `expm1`).
  - **Validación temporal (test 2024-2025, año epidémico): R²=+0.571, MAE 2.99** vs baseline R²=−0.36. Generaliza al brote.
  - Exporta semilla (últimos 4 casos por comuna) y rangos de clima para los sliders.
  - **ONNX verificado fiel** al modelo (diff 1e-6); ~372 KB → corre en el navegador.
- **Hallazgo clave (honesto):** el clima por sí solo NO predice el dengue (R²=−0.49); la inercia epidémica (casos recientes) sí. El clima es modulador, no motor — así funcionan los sistemas reales de alerta.

### Simulador (`src/features/simulator/`) ✅ *core funcional*
- **`forecast.ts`** — motor de pronóstico 100% en navegador con `onnxruntime-web` (backend wasm CPU, `numThreads=1`; wasm+glue cargados con `?url` desde `src/.../ortwasm/` → **demo offline sin headers COOP/COEP**). Replica fielmente el feature-engineering del pipeline Python (orden de 16 features, `log1p`/`expm1`).
- **Pronóstico autoregresivo recursivo**: por comuna mantiene un historial sembrado con `seed` (últimos 4 casos); cada semana calcula `l1/l2/l3/ma4`, predice, realimenta y avanza el horizonte (16 semanas). 1 inferencia ONNX por semana (batch de 25 comunas).
- **`SimulatorView.tsx`** — sliders de clima (precip/temp/humedad como escenario sostenido: `precip_acum8≈precip·8`, `*_mean8≈valor`), reproducción play/pause + slider semana a semana, panel de resumen (total AMB, pico proyectado, ranking de comunas en riesgo), trayectoria metropolitana y nota honesta "clima = modulador".
- **Mapa de riesgo (ECharts):** **una sola serie** sobre un mapa combinado (relleno de comunas coloreado por `visualMap` + contorno de municipios disuelto) para que relleno y contorno compartan **una transformación de roam** (zoom/arrastre sin delay). Orden de dibujo: Bucaramanga al fondo (solo asoma su borde exterior, blanco), comunas en medio (reciben el hover), **Floridablanca encima** (borde morado, se ve también su frontera interna; su dato es `silent` para no bloquear el hover). El estilo por región va en `data[].itemStyle` (en serie `map` `regions` no aplica). `RiskMap` usa `notMerge:false` para conservar el zoom al avanzar de semana.
- **Validado numéricamente** contra el mismo ONNX en Python: curva continua y plausible (~60–84 casos/sem AMB); los sliders mueven el resultado de forma realista (≈779–1514 casos acum. en 16 sem según el escenario de lluvia).
- **Capa de alerta temprana + recomendaciones** — clasifica cada comuna por **incidencia semanal** (casos/10.000 hab; umbrales alto≥3 / medio≥1,5 / vigilancia≥0,7, calibrados con la distribución del pronóstico) y genera **acciones de control vectorial** priorizadas (fumigación focalizada, eliminación de criaderos, alerta a IPS), con tendencia (↑/↓/–) y un mensaje titular dinámico. Cierra el ciclo *predicción → acción* (como el proyecto ganador 2025).
- **Traducción a pesos** — franja económica que multiplica los casos proyectados por el **costo medio por caso (≈$1,39 M COP**, ponderado con nuestras proporciones reales 68% ambulatorio / 31% hosp / 0,57% grave; ver `docs/06_IMPACTO_ECONOMICO.md`): muestra costo proyectado del horizonte y **ahorro potencial con acción temprana (−20%)**. Reactivo al escenario.
- **Modo "Tiempo real"** (`liveWeather.ts`) — toggle que consume el **clima real de Bucaramanga vía Open-Meteo** (API abierta, sin key, CORS; agrega los últimos 7 días → features semanales), lo fija como escenario (acotado al rango del modelo), refresca cada 10 min y cae a sliders manuales si falla. Cierra el requisito de **fuentes en tiempo real** del nivel Avanzado. *(Honesto: Open-Meteo es abierto pero no datos.gov.co; el histórico de entrenamiento sí usa IDEAM/CDMB oficiales. El clima sigue siendo modulador.)*

### Re-anclaje a 2026 — nowcasting con el boletín del INS (`scripts/build_nowcast_seed.py`) ✅ *2026-06-30*
**Problema:** el modelo es autoregresivo (necesita casos recientes como semilla) y el dato municipal real (`dengue.json`) se corta en **2025-S35** (~agosto). Presentando en jul–ago 2026, el horizonte caía en el pasado. **Solución:** re-anclar la semilla a 2026 usando el **boletín epidemiológico del INS** (Santander semanal, acumulado; y Bucaramanga real 2026).
- **Entrada:** `data/boletin_santander_semanal.csv` (rellenado a mano desde el boletín: Santander 2024 S1–52, 2025 S1–53, 2026 S1–24; **Bucaramanga real 2026 S1–22**). *Es dato crudo → vive en `data/`, NO versionado.*
- **Método (en el script):** ① diferencia el acumulado → casos semanales; ② calibra `f_Bga = Bga/Santander` en el solape con dato municipal real (2024 + 2025 S01–S35); ③ **Bucaramanga 2026**: usa su curva **real** del boletín, desagregada por comuna (share); ④ **Floridablanca 2026** (sin dato directo): estima `f_Florida × Santander`, repartida por la huella histórica de sus comunas; ⑤ reconstruye la semilla (4 semanas, **ancla 2026-S22**).
- **Validación (la baza de credibilidad):** `f_Bga` calibrado en 2024–2025 = **0,304**; aplicado al Santander 2026 predice Bucaramanga con **−11,2 %** de error vs. el dato real del boletín (real 1.098 vs 975). Que la fracción reproduzca el Bucaramanga real de 2026 **valida el método** → se aplica con confianza a Floridablanca (`f_Florida = 0,119`). *Para Bucaramanga se usa el dato real, así que ese −11 % solo acota la incertidumbre de Florida (la pata más débil, ya declarada).*
- **Frontera honesta** (registrada en `nowcast_2026.json`): **real** (Bucaramanga → 2026-S22) · **estimado** (Floridablanca, vía fracción validada) · **pronóstico** (de S22 en adelante).
- **Aplicado:** respaldo `public/data/model_meta_2025.json`; parche de `seed` + `last_week` (→ 2026-S22, 25 comunas) en `model_meta.json` + bloque `reanclaje_2026`; etiqueta del horizonte `ANCHOR = {2026, 22}` en `SimulatorView.tsx`. Build verde.
- **Pendiente (UI):** panel "Situación 2026 · Santander" (dato real del boletín, serie ya en `nowcast_2026.json`) + vista de **backtest** (pronóstico vs. realidad) + marcar la frontera real/estimado/pronóstico.

### Navegación / layout (`src/layout/MainLayout.tsx`)
- Sidebar glass con enlaces a **Inicio (landing)**, Dashboard y Simulador. El logo "EcoSalud IA" también vuelve al landing. (Antes no había forma de regresar al landing desde el panel.)

### Landing (`src/features/landing/`) — *ramas del equipo ya integradas*
- Scrollytelling: **Hero → Threat → Transition → Territory → Solution → Simulator → CTA**.
- **Aporte de Daniela (rama `daniela`, integrado):** storytelling actos 1–5; `ThreatSection` y `TerritorySection` alimentadas con **datos reales SIVIGILA** (`LandingView` carga `loadDengueData` y pasa `stats`); nueva `TransitionSection`.
- **Sección de contacto + footer global (rama `feat/seccion-contacto`, integrado):** "Contacto de los Desarrolladores" en `CTASection` + footer en `MainLayout`. Al integrar se **conservó la lógica móvil off-canvas** del sidebar (solo se sumó el footer); resueltos a mano los conflictos en `MainLayout.tsx/.module.css` y `.gitignore`.
- **Pendiente narrativo (brief listo):** falta el **acto económico** ("el dinero es casi todo en salud") — ver [`docs/07_BRIEF_NARRATIVA_ECONOMICA.md`](docs/07_BRIEF_NARRATIVA_ECONOMICA.md): contador de costo en `ThreatSection` (stakes) + nueva sección de **retorno/ahorro** antes del CTA (payoff).

---

## ⏳ Lo que falta

### Documentación técnica del concurso (criterios de evaluación)
Ya creados en `docs/`: **`INFORME_SIMULADOR.md`** (cómo funciona el código), **`INFORME_MATEMATICO.md`** (todo el proceso con fórmulas: datasets → features → modelo → validación → pronóstico) y **`06_IMPACTO_ECONOMICO.md`** (cuánto cuesta el dengue y cuánto ahorra la herramienta, con fuentes citadas).

**Redactados el 2026-06-30** (cierran los pendientes de documentación técnica):
- **`01_METODOLOGIA_CRISP-ML.md`** — el proyecto enmarcado en las 6 fases de CRISP-ML(Q), con los *quality gates* de cada fase.
- **`02_ARQUITECTURA.md`** — arquitectura consolidada (offline Python → artefactos → navegador) + diagramas Mermaid de componentes y despliegue.
- **`03_ANALISIS_DATOS_EDA.md`** — EDA con cifras reales (demografía, severidad, estacionalidad, geografía, clima).
- **`04_DIAGRAMAS_FLUJO.md`** — diagramas Mermaid: pipeline de datos, entrenamiento, inferencia recursiva en navegador, ciclo predicción→acción.
- **`05_FUENTES_DATOS_ABIERTOS.md`** — tabla de fuentes con enlaces, licencias y trazabilidad dato→artefacto.
- **`README.md` actualizado** — corregido el stack (se quitaron Mapbox/Canvas/GSAP/DANE que ya no aplican; refleja ECharts + ONNX + Zustand).

Pendiente por redactar/estructurar:
- **Metodología CRISP-ML** — ~~enmarcar el trabajo en las fases~~ ✅ hecho (`01_…`).
- **Arquitectura de la solución** — ~~consolidar lo disperso + diagrama~~ ✅ hecho (`02_…`).
- **Análisis de datos (EDA)** — ~~documento con cifras~~ ✅ hecho (`03_…`); falta exportar **gráficos** como imágenes para el informe impreso.
- **Diagramas de flujo** (Mermaid) — ~~datos, entrenamiento, inferencia~~ ✅ hecho (`04_…`).
- **Evidencia de datos abiertos** — ~~tabla de fuentes con enlaces y licencias~~ ✅ hecho (`05_…`).

### Obligatorio para concursar (puerta de elegibilidad)
- **Publicar el "Uso" en datos.gov.co/usos** (`https://herramientas.datos.gov.co/usos`) — sin esto la propuesta **no se evalúa**.
- Inscripción dentro del cronograma; final presencial 1.ª semana de agosto (GovCamp 2026).

### Otros
- El **core ya está completo** (dashboard + modelo + simulador interactivo + alerta + economía + tiempo real). **Ramas del equipo ya integradas a `main`** (landing de Daniela + sección de contacto); build verde (`tsc -b && vite build`). Queda pulir la landing y sumar el acto económico (brief listo).
- Verificar el simulador en **producción** (Vercel) tras el deploy: que el wasm cargue offline en el entorno real.
- **Nota menor de consistencia:** `ml/train_model.py` usa `GradientBoostingRegressor` (sklearn) — el docstring y el `nota` de `model_meta.json` lo etiquetan como "HistGradientBoosting"; la etiqueta es imprecisa, el modelo real es GBR clásico (n_estimators=400, max_depth=4, lr=0.04). El `INFORME_MATEMATICO.md` está correcto.

> **Autoevaluación rúbrica (pesos oficiales):** Innovación 15 · Datos abiertos 20 · Rigor 15 · IA 20 · Impacto 20 · Diseño 10. Estimación actual ≈ **80/100**; con la documentación + registro ≈ **86–90** (perfil de finalista). Topes estructurales: IA (GBM es "intermedio" en su taxonomía; nos apoyamos en el *modelo de simulación* + despliegue) e Impacto (el 5/5 exige piloto operativo real).

## 🌿 Ramas del equipo (✅ integradas a `main` — 2026-06-18)
- **`origin/daniela`** — landing storytelling (actos 1–5) + `ThreatSection`/`TerritorySection` con datos reales SIVIGILA + `TransitionSection`. Merge limpio. *(Los 2 errores de build que tenía la rama ya estaban resueltos por su commit `fc4dd7c` "revert ThreatSection".)*
- **`origin/feat/seccion-contacto`** — sección de contacto en `CTASection` + footer global en `MainLayout`. Conflictos resueltos a mano (`MainLayout.tsx/.module.css`, `.gitignore`) **conservando el sidebar móvil off-canvas**; se quitó un marcador "DANIELA" colado en el `<title>`.
- *Estado (2026-06-30):* los merges del equipo **ya están en `origin/main`**. La rama de trabajo actual es `daniela`; el único commit local sin `push` es `8683320` ("Actualización del dashboard con nuevos indicadores y mejoras visuales"). Build verde verificado.

### 4. Pendientes menores / mejoras
- Santander: opción de nombres siempre visibles.
- Panel de correlación clima ↔ dengue en el dashboard.
- Optimizar bundle (ECharts pesa ~1.5 MB).

---

## ⚠️ Caveats de datos (declarar en la sustentación)
- **Profundidad temporal asimétrica:** Bucaramanga 2015–2025; Floridablanca/Girón solo 2023–2025 (geocodificado). Las predicciones de Florida se apoyan más en clima + estacionalidad.
- **Girón** no tiene comunas/barrios en datos abiertos (AMB, ArcGIS, OSM verificados) → se muestra como burbujas.
- **Geocodificación a nivel de calle** (no de casa): casos de una misma calle comparten coordenada → se agregan en burbujas proporcionales.
- **Clima CDMB** solo cubre 2025; el histórico largo se apoya en IDEAM.

---

## 📋 Requisitos del concurso
| Requisito | Estado |
|---|---|
| +10.000 filas | ✅ 28.626 (solo Bucaramanga) |
| +20 variables | ✅ 76 columnas |
| Datos abiertos (datos.gov.co / IDEAM / CDMB / GIS oficiales) | ✅ |
| Integración clima + salud | ✅ clima semanal procesado + panel Clima vs Dengue |
| IA predictiva avanzada | ✅ GradientBoosting (R²=0.57 en brote) → ONNX + **simulador interactivo en navegador** |
| Código abierto / repo público | ✅ |

---

## 🔧 Cómo correr / regenerar
```bash
npm install && npm run dev      # dashboard en http://localhost:5173
# Regenerar artefactos (requiere los CSV crudos en data/, NO versionados):
python scripts/build_dashboard_data.py
python scripts/build_geo_data.py
python scripts/build_climate_data.py
python scripts/geocode_metro.py   # usa caché; primera vez ~2-3 h
python scripts/build_municipios_outline.py  # requiere shapely; -> amb_municipios.geojson
# Modelo de IA:
pip install -r ml/requirements.txt
python ml/build_training_table.py
python ml/train_model.py          # entrena + exporta public/data/model.onnx
# Re-anclaje a 2026 (requiere data/boletin_santander_semanal.csv relleno; NO versionado):
python scripts/build_nowcast_seed.py   # -> public/data/nowcast_2026.json (semilla 2026-S22)
```
> Los CSV crudos y el caché de geocodificación viven en `data/` y **no** se versionan (ver `.gitignore`). Los artefactos procesados sí están en `public/data/`.
> El wasm de `onnxruntime-web` (`src/features/simulator/ortwasm/`, ~11 MB) **sí** se versiona para que el build funcione offline. Si se actualiza `onnxruntime-web`, recopiar `ort-wasm-simd-threaded.{wasm,mjs}` desde `node_modules/onnxruntime-web/dist/`.
>
> 
---
# 🎨 Actualización Landing Storytelling — Daniela Reyes (18/06/2026)

## 🎯 Objetivo de la Iteración

Transformar la landing principal del proyecto en una experiencia narrativa inmersiva para los jurados, guiándolos progresivamente desde la comprensión del problema epidemiológico hasta la propuesta de solución basada en Inteligencia Artificial.

La landing fue reorganizada bajo una estructura de storytelling compuesta por ocho actos conectados entre sí mediante una narrativa continua.

---

# 🔴 ACTO 1 — LA AMENAZA
### Componente: ThreatSection

## Objetivo

Presentar la situación actual del dengue en Bucaramanga utilizando datos reales de vigilancia epidemiológica.

## Mejoras implementadas

✅ Actualización de indicadores con datos reales SIVIGILA 2025.

✅ Integración de métricas clave:

- Casos notificados.
- Hospitalizaciones.
- Fallecidos.
- Tasa de letalidad.

✅ Rediseño visual utilizando identidad roja para transmitir sensación de alerta epidemiológica.

## Resultado

El usuario comprende inmediatamente que el dengue continúa siendo una amenaza activa para la ciudad.

---

# 🔥 ACTO 2 — LA HISTORIA DEL BROTE
### Componente: ThreatSection

## Objetivo

Mostrar la evolución del brote y evidenciar que detrás de los números existe una emergencia en desarrollo.

## Mejoras implementadas

✅ Construcción de narrativa basada en el comportamiento reciente de los casos.

✅ Incorporación de mensajes orientados a generar contexto antes de presentar los análisis posteriores.

✅ Refuerzo visual de la sensación de urgencia.

## Resultado

El usuario deja de ver únicamente cifras aisladas y comienza a entender la dimensión del brote.

---

# 👥 ACTO 3 — LAS PERSONAS DETRÁS DE LOS DATOS
### Componente: ThreatSection

## Objetivo

Humanizar los datos epidemiológicos.

## Mejoras implementadas

✅ Reestructuración del discurso para recordar que cada caso representa personas, familias y comunidades.

✅ Énfasis en el impacto social del dengue.

✅ Integración visual coherente con la narrativa del brote.

## Resultado

Se genera una conexión emocional antes de pasar al análisis clínico.

---

# 🏥 ACTO 4 — EL IMPACTO CLÍNICO
### Componente: ThreatSection

## Objetivo

Mostrar las consecuencias reales que el dengue genera sobre el sistema de salud.

## Mejoras implementadas

✅ Presentación de indicadores clínicos.

✅ Visualización de:

- Casos sin signos de alarma.
- Casos con signos de alarma.
- Casos graves.
- Hospitalizaciones.
- Mortalidad.

✅ Hallazgo clínico destacado para resumir el comportamiento epidemiológico observado.

## Resultado

El usuario comprende la presión que el dengue genera sobre hospitales y servicios de salud.

---

# 🌐 TRANSICIÓN NARRATIVA
### Componente: TransitionSection

## Objetivo

Conectar el impacto clínico con la dimensión territorial del problema.

## Mejoras implementadas

✅ Creación completa del componente TransitionSection.

✅ Diseño basado en:

- Redes epidemiológicas.
- Coordenadas geográficas.
- Sistemas de vigilancia territorial.

✅ Implementación de animaciones GSAP y ScrollTrigger.

✅ Eliminación de cambios bruscos entre secciones.

## Resultado

La transición se convierte en un puente narrativo que prepara al usuario para descubrir dónde se concentra el riesgo.

---

# 🗺️ ACTO 5 — EL TERRITORIO
### Componente: TerritorySection

## Objetivo

Demostrar que los brotes siguen patrones espaciales identificables.

## Mejoras implementadas

✅ Desarrollo completo de TerritorySection.

✅ Integración de análisis territorial basado en datos históricos.

✅ Identificación del Área Metropolitana de Bucaramanga como principal núcleo epidemiológico.

## Indicadores territoriales

- Participación del AMB.
- Casos históricos.
- Casos graves.
- Municipios involucrados.

## Hallazgos

- El AMB concentra aproximadamente el 69.3% de los casos históricos.
- Bucaramanga representa la mayor carga epidemiológica regional.
- Los patrones espaciales evidencian persistencia territorial del riesgo.

## Resultado

El usuario comprende dónde se concentra históricamente la transmisión.

---

# 💰 ACTO 6 — EL IMPACTO ECONÓMICO
### Componente: CostSection

## Objetivo

Demostrar que el dengue también representa una carga económica para la ciudad.

## Mejoras implementadas

✅ Desarrollo de sección económica basada en literatura científica.

✅ Estimación de costos asociados al dengue.

✅ Indicadores económicos:

- Costo estimado del brote.
- Casos graves.
- Hospitalizaciones.
- Ahorro potencial mediante intervención temprana.

✅ Incorporación de animaciones activadas por scroll.

✅ Implementación de identidad visual amarillo–naranja.

## Fuentes y metodología

Se incorporó una sección específica para validar la información presentada mediante referencias científicas y datos históricos SIVIGILA.

## Resultado

El usuario comprende el impacto financiero asociado a los brotes de dengue.

---

# 🤖 ACTO 7 — LA SOLUCIÓN TECNOLÓGICA
### Componente: SimulatorSection

## Objetivo

Presentar el modelo predictivo como respuesta al problema identificado.

## Mejoras implementadas

✅ Rediseño visual completo de SimulatorSection.

✅ Integración estética basada en Inteligencia Artificial.

✅ Implementación de:

- Redes neuronales estilizadas.
- Partículas dinámicas.
- Conexiones tipo grafo.
- Halos radiales tecnológicos.
- Gradientes de profundidad.

✅ Unificación cromática utilizando cian y morado.

## Resultado

La Inteligencia Artificial se presenta como la herramienta capaz de anticipar escenarios epidemiológicos antes de que se conviertan en emergencias sanitarias.

---

# 🏁 ACTO 8 — CIERRE Y PRESENTACIÓN DEL PROYECTO
### Componente: CTASection

## Objetivo

Cerrar la narrativa y presentar formalmente la solución desarrollada.

## Mejoras implementadas

✅ Rediseño completo del footer.

✅ Integración visual con SimulatorSection.

✅ Fondo tecnológico consistente con la identidad visual del proyecto.

✅ Mejora de:

- Información institucional.
- Botones principales.
- Datos del concurso.
- Contactos del equipo.

## Resultado

La experiencia finaliza con una presentación profesional y coherente con todo el recorrido narrativo.

---

# 🚀 Resultado General

La landing evolucionó hacia una experiencia narrativa completa basada en ocho etapas:

🔴 La amenaza  
↓  
🔥 La historia del brote  
↓  
👥 Las personas detrás de los datos  
↓  
🏥 El impacto clínico  
↓  
🌐 Transición territorial  
↓  
🗺️ El territorio  
↓  
💰 El impacto económico  
↓  
🤖 La solución tecnológica  
↓  
🏁 Presentación final del proyecto

Esta estructura permite que los jurados comprendan progresivamente:

- Qué está ocurriendo.
- Cómo evolucionó el brote.
- Quiénes se ven afectados.
- Qué consecuencias clínicas genera.
- Dónde se concentra el riesgo.
- Cuánto cuesta.
- Cómo puede anticiparse.
- Por qué la solución propuesta aporta valor.

