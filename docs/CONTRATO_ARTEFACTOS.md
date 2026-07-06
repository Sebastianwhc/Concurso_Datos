# Contrato de Artefactos de Datos

> **Nota sobre `api_spec.md`:** la estructura sugerida contempla una especificación de API
> (OpenAPI/Swagger). Este proyecto **no expone una API REST**: es una aplicación **estática** en la que
> el modelo corre en el navegador y los datos se sirven como **archivos JSON** desde `public/data/`.
> El "contrato" equivalente —lo que el frontend espera de cada artefacto— se documenta aquí. Esta
> decisión de arquitectura (sin backend) está justificada en [`02_ARQUITECTURA.md`](02_ARQUITECTURA.md).

Todos los artefactos se sirven bajo `"/data/*.json"` (base URL de Vite) y se consumen con `fetch`.

---

## `dengue.json` — consolidado SIVIGILA individual
Consumido por `src/features/dashboard/dengue.ts` (`loadDengueData`).
```jsonc
{
  "meta": {
    "total": 28626,
    "years": [2015, ..., 2025],
    "source": "SIVIGILA individual — Bucaramanga",
    "dicts": { "sexo": [...], "edad": [...], "estrato": [...],
               "regimen": [...], "severidad": [...], "tipo_caso": [...], "municipio": [...] },
    "symptoms": ["fiebre", "cefalea", ... ]   // 21 nombres para el bitmask
  },
  "columns": ["anio","semana","sexo","edad","estrato","regimen",
              "severidad","tipo_caso","hosp","fallecido","sintomas","municipio"],
  "rows": [[2025, 12, 0, 3, 2, 0, 1, 1, 0, 0, 5, 0], ... ]   // enteros; índices → dicts
}
```
Diccionario completo en [`data_dictionary.md`](data_dictionary.md) §1.

---

## `model.onnx` + `model_meta.json` — modelo de pronóstico
Consumidos por `src/features/simulator/forecast.ts`.
```jsonc
// model_meta.json (resumen de campos que usa el frontend)
{
  "feature_order": ["semana","sin52","cos52","incidencia_base","log_pob","es_floridablanca",
                    "precip","temp","humedad","precip_acum8","temp_mean8","humedad_mean8",
                    "casos_l1","casos_l2","casos_l3","casos_ma4"],   // 16, ORDEN EXACTO
  "target_transform": "log1p",         // aplicar expm1 a la salida ONNX
  "clima_ranges": { "precip": [min,max], "temp": [...], "humedad": [...] },  // límites de sliders
  "comunas": [ ... ],                  // 25 comunas del AMB
  "seed":    { "<comuna>": [c_l4, c_l3, c_l2, c_l1] },   // últimos 4 casos (semilla autoregresiva)
  "last_week": { "year": 2026, "week": 22 },
  "metrics": { "baseline": {...}, "modelo": { "R2": 0.571, "MAE": 2.99 } },
  "reanclaje_2026": { "f_Bga": 0.304, "f_Florida": 0.119, "error_validacion": -0.112 }
}
```
El contrato crítico es el **orden de las 16 features** y la **transformación `log1p`/`expm1`**: deben
coincidir byte a byte entre `ml/train_model.py` (Python) y `forecast.ts` (navegador).

---

## `nowcast_2026.json` — semilla re-anclada
```jsonc
{
  "anchor": { "year": 2026, "week": 22 },
  "frontera": { "observado": "...", "estimado": "Floridablanca", "pronostico": "S22+" },
  "seed": { "<comuna>": [ ... ] }
}
```

## `backtest_2024.json` — validación ciega del brote
```jsonc
{ "start_week": {"year":2024,"week":8}, "series": [ {"week":..., "real":.., "pred":..} ] }
```

## Artefactos geográficos y de apoyo
| Archivo | Estructura |
|---------|-----------|
| `santander_dengue.json` | `{ municipios: [...], years: [...], data: { <mun>: { <year>: casos } } }` |
| `clima_semanal.json` | serie semanal `[{ year, week, precip, temp, humedad, pm25 }]` + climatología |
| `comunas_casos.json` | `{ <comuna>: casos }` |
| `metro_puntos.json` | `[{ lat, lon, casos, comuna }]` |
| `*.geojson` (en `public/`) | FeatureCollection estándar (comunas / municipios / metropolitana) |

> **Regla de compatibilidad:** cualquier cambio en la estructura de estos artefactos debe reflejarse
> simultáneamente en el script que los genera (`scripts/` o `ml/`) y en el módulo del frontend que los
> consume. Son el único "contrato" entre el mundo Python (offline) y el navegador.
