# 📓 Bitácora — EcoSalud IA · Simulador Predictivo de Dengue (AMB)

**Concurso:** Datos al Ecosistema 2026 · Categoría Avanzado · Reto Salud y Bienestar
**Repo:** https://github.com/Sebastianwhc/Concurso_Datos · **Deploy:** https://concursodatos.vercel.app
**Última actualización:** 2026-06-17

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

### Navegación / layout (`src/layout/MainLayout.tsx`)
- Sidebar glass con enlaces a **Inicio (landing)**, Dashboard y Simulador. El logo "EcoSalud IA" también vuelve al landing. (Antes no había forma de regresar al landing desde el panel.)

### Landing
- Construida previamente (scrollytelling: Hero, Threat, Territory, Solution, Simulator, CTA).

---

## ⏳ Lo que falta

### Documentación técnica del concurso (criterios de evaluación)
Ya creados en `docs/`: **`INFORME_SIMULADOR.md`** (cómo funciona el código), **`INFORME_MATEMATICO.md`** (todo el proceso con fórmulas: datasets → features → modelo → validación → pronóstico) y **`06_IMPACTO_ECONOMICO.md`** (cuánto cuesta el dengue y cuánto ahorra la herramienta, con fuentes citadas).

Pendiente por redactar/estructurar:
- **Metodología CRISP-ML** — enmarcar el trabajo en las fases (se sugiere en las reglas).
- **Arquitectura de la solución** — consolidar lo disperso + diagrama.
- **Análisis de datos (EDA)** — documento con cifras y gráficos.
- **Diagramas de flujo** (Mermaid): datos, entrenamiento, inferencia.
- **Evidencia de datos abiertos** — tabla de fuentes con enlaces y licencias.
- **Actualizar `README.md`** — hoy menciona Mapbox/Canvas/DANE que ya no aplican.

### Obligatorio para concursar (puerta de elegibilidad)
- **Publicar el "Uso" en datos.gov.co/usos** (`https://herramientas.datos.gov.co/usos`) — sin esto la propuesta **no se evalúa**.
- Inscripción dentro del cronograma; final presencial 1.ª semana de agosto (GovCamp 2026).

### Otros
- El **core ya está completo** (dashboard + modelo + simulador interactivo + alerta + economía + tiempo real). Queda integrar las ramas del equipo y pulir la landing.
- Verificar el simulador en **producción** (Vercel) tras el deploy: que el wasm cargue offline en el entorno real.

> **Autoevaluación rúbrica (pesos oficiales):** Innovación 15 · Datos abiertos 20 · Rigor 15 · IA 20 · Impacto 20 · Diseño 10. Estimación actual ≈ **80/100**; con la documentación + registro ≈ **86–90** (perfil de finalista). Topes estructurales: IA (GBM es "intermedio" en su taxonomía; nos apoyamos en el *modelo de simulación* + despliegue) e Impacto (el 5/5 exige piloto operativo real).

## 🌿 Ramas del equipo (pendientes de integrar)
- **`origin/daniela`** — rediseño de `ThreatSection` (landing) con gráficos de datos reales de Bucaramanga (edad + tendencia anual, 2024/brote en rojo). ⚠️ Tiene 2 errores que rompen el build: import sin usar (línea 4) y propiedad duplicada en objeto (línea 666, TS1117). **Revisar enfoque:** debe ser *storytelling*, no un segundo dashboard.
- **`origin/feat/seccion-contacto`** — sección "Contacto de los Desarrolladores" en `CTASection` + footer global en `MainLayout`. ⚠️ Conflicto con `MainLayout` (mi sidebar móvil off-canvas): al integrar, conservar la lógica móvil y añadir solo el footer.
- *Decisión actual:* se quedan en sus ramas; se integran más adelante con revisión.

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
```
> Los CSV crudos y el caché de geocodificación viven en `data/` y **no** se versionan (ver `.gitignore`). Los artefactos procesados sí están en `public/data/`.
> El wasm de `onnxruntime-web` (`src/features/simulator/ortwasm/`, ~11 MB) **sí** se versiona para que el build funcione offline. Si se actualiza `onnxruntime-web`, recopiar `ort-wasm-simd-threaded.{wasm,mjs}` desde `node_modules/onnxruntime-web/dist/`.
