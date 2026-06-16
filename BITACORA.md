# 📓 Bitácora — EcoSalud IA · Simulador Predictivo de Dengue (AMB)

**Concurso:** Datos al Ecosistema 2026 · Categoría Avanzado · Reto Salud y Bienestar
**Repo:** https://github.com/Sebastianwhc/Concurso_Datos · **Deploy:** https://concursodatos.vercel.app
**Última actualización:** 2026-06-16

---

## 🎯 Visión del producto (3 piezas)
1. **Landing / Storytelling** — presentación inmersiva para los jurados.
2. **Dashboard histórico** — demografía, clínica, canal endémico y mapas.
3. **Simulador predictivo (core)** — heatmap por comuna + sliders de clima + modelo IA.

## 🏗️ Decisiones de arquitectura
- **Sin backend.** Todo corre en el navegador; deploy estático en Vercel.
- **Modelo de IA en el navegador (ONNX).** Se entrena offline en Python y se exporta a ONNX → inferencia con `onnxruntime-web`. Elegido por robustez en demo en vivo (no depende de servidor ni WiFi).
- **Pipelines offline en Python** → artefactos compactos en `public/data/`. El CSV nacional de 218 MB **nunca** llega al navegador.
- **Escala metropolitana:** Bucaramanga ancla (dataset profundo), Floridablanca y Girón se suman para la capa espacial.
- Stack: React + Vite + TS, ECharts (gráficos y mapas), Zustand, deck.gl/mapbox (reservado para el simulador).

---

## ✅ Lo que se ha hecho

### Datos y pipelines (`scripts/`)
- **`build_dashboard_data.py`** → `dengue.json`: decodifica el SIVIGILA individual de Bucaramanga (**28.626 registros, 76 variables, 2015–2025**) a formato columnar (códigos SIVIGILA, mojibake, 21 síntomas en bitmask). ~820 KB.
- **`build_geo_data.py`** → `santander_dengue.json`: agrega el archivo nacional (2.46M filas) a dengue por municipio de Santander (**87 municipios, 2007–2022**).
- **`geocode_metro.py`** → `metro_puntos.json` + `comunas_casos.json`: geocodifica direcciones (Nominatim + caché + fallbacks) y asigna comuna por point-in-polygon. **6.703 / 8.365 casos geocodificados (80%)**: Bucaramanga 475, Floridablanca 5.500, Girón 728 (2023–2025).
- **Geojson de comunas** (fuentes GIS oficiales, en `public/`): Bucaramanga 17 (AMB GIS) + Floridablanca 8 (geoportal Floridablanca) → `amb_comunas.geojson`. Girón: no publica comunas abiertas.

### Dashboard (`src/features/dashboard/`)
- **Filtros** como tarjetas desplegables con **multi-selección** (año, sexo, severidad, estrato, hospitalización). Filtrado 100% en cliente.
- **KPIs**: casos, hospitalizados, dengue grave, fallecidos/letalidad.
- **6 gráficos ECharts**: canal endémico semanal, tendencia anual, pirámide edad×sexo, clasificación clínica, estrato, prevalencia de síntomas.
- **Sección geoespacial** (al final):
  - **Santander** — coropleto por municipio (2007–2022) con bordes nítidos y nombre al hover.
  - **Área Metropolitana** — comunas de Bga (17) y Florida (8) como base tintada por ciudad + **burbujas de casos** (agregadas por ubicación, tamaño ∝ nº de casos), filtro de año, tooltip con nombre de comuna. Girón como burbujas.
- **Responsive** (móvil): sidebar off-canvas, grillas y filtros adaptados.

### Landing
- Construida previamente (scrollytelling: Hero, Threat, Territory, Solution, Simulator, CTA).

---

## ⏳ Lo que falta

### 1. Clima (motor del modelo) — *siguiente paso*
- Procesar **CDMB** (`temp_bga_1/2.csv`, horario 2025: T, HR, lluvia, PM2.5/PM10, etc.) + **IDEAM** (`precipitacion` diaria 2007–2026, `temp` mensual, `humedad` a 2024).
- Generar **series semanales alineadas** con dengue + variables rezagadas (4–10 semanas).

### 2. Modelo de IA (core)
- Tabla de entrenamiento **comuna × semana × clima + features** (población, estrato, incidencia previa).
- Bucaramanga: desagregar su curva histórica entre comunas con la huella geocodificada. Floridablanca: serie comuna×semana 2023–2025 directa.
- Entrenar **ensamblaje (LightGBM/XGBoost)** → exportar a **ONNX**.
- (Opcional "wow": pequeña red espaciotemporal.)

### 3. Simulador (`SimulatorView` hoy es un stub)
- Heatmap por comuna alimentado por el modelo.
- **Sliders de clima** + inferencia ONNX en el navegador.
- Animación semana a semana (play) = propagación.
- Zonas de riesgo (verde/amarillo/rojo).

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
| Integración clima + salud | ⏳ datos listos, integración pendiente |
| IA predictiva avanzada | ⏳ pendiente (core) |
| Código abierto / repo público | ✅ |

---

## 🔧 Cómo correr / regenerar
```bash
npm install && npm run dev      # dashboard en http://localhost:5173
# Regenerar artefactos (requiere los CSV crudos en data/, NO versionados):
python scripts/build_dashboard_data.py
python scripts/build_geo_data.py
python scripts/geocode_metro.py   # usa caché; primera vez ~2-3 h
```
> Los CSV crudos y el caché de geocodificación viven en `data/` y **no** se versionan (ver `.gitignore`). Los artefactos procesados sí están en `public/data/`.
