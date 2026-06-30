# 📊 Análisis exploratorio de datos (EDA)

> Qué dicen los datos **antes** de modelar: volumen, calidad, demografía, clínica, estacionalidad, geografía y clima.
> Las cifras provienen de los artefactos procesados (`public/data/dengue.json`, `model_meta.json`, `clima_semanal.json`) y de los conteos del SIVIGILA de Bucaramanga 2015–2025.
> Acompaña a [`01_METODOLOGIA_CRISP-ML.md`](01_METODOLOGIA_CRISP-ML.md) (fase 2) y a [`06_IMPACTO_ECONOMICO.md`](06_IMPACTO_ECONOMICO.md).

---

## 1. Volumen y cobertura

| Dataset | Filas | Variables | Periodo | Granularidad |
|---|---|---|---|---|
| SIVIGILA individual (Bucaramanga) | **28.626** | **76** | 2015–2025 | un caso por fila |
| SIVIGILA nacional → Santander | 2,46 M → 87 municipios | — | 2007–2022 | municipio × año |
| Clima semanal (IDEAM + CDMB) | serie semanal | 4 (precip, temp, humedad, PM2.5) | 2007–2026 | semana ISO |
| Casos geocodificados (AMB) | 8.365 (6.703 ubicados, **80 %**) | — | 2023–2025 | dirección → comuna |

> Cumple holgadamente los mínimos del concurso: **+10.000 filas** (28.626) y **+20 variables** (76), solo con Bucaramanga.

---

## 2. Calidad de los datos (lo que hubo que tratar)

| Problema detectado | Tratamiento |
|---|---|
| Códigos SIVIGILA y **mojibake** (texto mal codificado) | decodificación a formato columnar legible (`build_dashboard_data.py`) |
| 21 síntomas dispersos en columnas | empaquetados en **bitmask** (1 entero por caso) |
| Direcciones en texto libre | geocodificación Nominatim + caché + fallbacks; *point-in-polygon* a comuna |
| Temperatura: la estación del valle (Palonegro) termina en 2019 | continuación con Mogotes + **corrección de altitud (+2,2 °C)** |
| Clima de fuentes heterogéneas (diario, mensual, horario) | unificado a **semana ISO** (suma para lluvia, media para temp/humedad) |
| Valores faltantes en features | imputación por **mediana** (en entrenamiento) |

**Caveats declarados** (honestidad metodológica):
- **Profundidad temporal asimétrica:** Bucaramanga 2015–2025; Floridablanca/Girón solo 2023–2025.
- **Girón** no publica comunas en datos abiertos → se representa como burbujas, no se modela por comuna.
- **Geocodificación a nivel de calle** (no de casa): casos de una misma calle comparten coordenada.
- **Clima CDMB** solo cubre 2025; el histórico largo se apoya en IDEAM.

---

## 3. Perfil clínico y de severidad

De los 28.626 casos de Bucaramanga (2015–2025):

| Desenlace | % | Casos aprox. |
|---|---|---|
| Ambulatorio (sin hospitalización) | **68,4 %** | ~19.580 |
| Hospitalizado (no grave) | **31,0 %** | ~8.870 |
| Dengue grave | **0,57 %** | ~163 |
| Letalidad | **0,06 %** | **16 fallecidos** |

> Este perfil es el que pondera el **costo medio por caso (~$1,39 M COP)** en [`06_IMPACTO_ECONOMICO.md`](06_IMPACTO_ECONOMICO.md). La mayoría de casos son ambulatorios (baratos), pero el 31 % hospitalizado concentra la carga económica.

El dataset incluye además **pirámide edad × sexo**, **clasificación clínica**, **estrato socioeconómico** y **prevalencia de los 21 síntomas** (todos visualizados en el dashboard).

---

## 4. Estacionalidad y la curva temporal

- El dengue en el AMB es **fuertemente estacional**: la incidencia sigue un ciclo anual ligado al clima (lluvias → criaderos) con rezago de semanas.
- Sobre el ciclo estacional se montan **brotes epidémicos** plurianuales. El **brote de 2024** es el evento dominante de la serie.

| Escenario (Bucaramanga) | Casos/año |
|---|---|
| Año promedio (2015–2025) | **2.602** |
| **Brote 2024** | **11.541** (×4,4 el promedio) |

> Implicación para el modelado: la estacionalidad se codifica con `sin52/cos52` (semana cíclica) y la magnitud del brote se captura con las **features autoregresivas** (`casos_l1/l2/l3`, `casos_ma4`). El brote 2024–2025 se reservó como **conjunto de test temporal** — la prueba más dura posible.

---

## 5. Heterogeneidad geográfica (por comuna)

El AMB modelado son **25 comunas**: 17 de Bucaramanga + 8 de Floridablanca. La incidencia y la huella de casos varían mucho entre comunas.

**Bucaramanga — comunas con mayor incidencia base** (casos históricos por 1.000 hab) y mayor *share* espacial (fracción de los casos geocodificados de la ciudad):

| Comuna | Pob. | Incidencia base | Share |
|---|---|---|---|
| Tejar (B16) | 17.641 | **6,63** | **0,178** |
| La Pedregosa (B9) | 14.183 | 5,29 | 0,114 |
| Centro (B15) | 6.396 | 3,75 | 0,037 |
| Provenza (B10) | 39.108 | 2,25 | 0,134 |
| La Concordia (B6) | 22.850 | 2,10 | 0,073 |
| Oriental (B13) | 54.093 | 1,31 | 0,108 |

> Tejar y La Pedregosa concentran riesgo desproporcionado para su población → son objetivos naturales de control focalizado. Esta heterogeneidad es justo lo que el simulador explota para **priorizar comunas**.

**Floridablanca** muestra incidencias base mucho más altas (p. ej. Bosque/Molinos 48,0; Villabel/Santana 34,8). **Atención al caveat:** Floridablanca solo tiene datos 2023–2025 (geocodificación real sobre una ventana corta y de alta transmisión), por lo que su incidencia base **no es comparable directamente** con la de Bucaramanga (serie larga 2015–2025). Sus proyecciones se apoyan más en clima + estacionalidad.

---

## 6. Clima (rangos observados)

Valores semanales del valle del AMB (medianas y rango central, de `model_meta.json → clima_ranges`, que definen los sliders del simulador):

| Variable | Mín (p05) | Mediana | Máx (p95) |
|---|---|---|---|
| Precipitación | 1,1 mm | **34,2 mm/sem** | 89,9 mm |
| Temperatura | 21,0 °C | **21,9 °C** | 23,0 °C |
| Humedad | 50 % | **85,2 %** | 100 % |

> La temperatura del valle es **muy estable** (±1 °C): por eso, en el AMB, la temperatura aporta poca señal predictiva y la lluvia/humedad (criaderos) pesan más como moduladores.

---

## 7. La conclusión del EDA que orientó el modelado

Tres observaciones del análisis exploratorio definieron el enfoque:

1. **La serie tiene memoria fuerte** (autocorrelación temporal): los casos de una semana se parecen a los de las anteriores → justifica un modelo **autoregresivo**.
2. **El clima es estacional pero de rango estrecho** (sobre todo la temperatura) → entra como **modulador**, no como motor (confirmado luego: modelo solo-clima da R² ≈ −0,49, ver [`INFORME_MATEMATICO.md`](INFORME_MATEMATICO.md) §6).
3. **El riesgo es muy heterogéneo entre comunas** → tiene sentido modelar a nivel **comuna × semana** y priorizar geográficamente.

> Estas tres conclusiones son exactamente las tres familias de features del modelo: **autoregresivas + clima + estáticas por comuna**.

---

## 8. Pendiente

- Exportar los gráficos del EDA como **imágenes** (PNG/SVG) para el informe impreso del concurso (hoy son interactivos en el dashboard).
- Tabla de **correlación clima ↔ dengue** rezagada (cuantificar el desfase óptimo de la lluvia).
