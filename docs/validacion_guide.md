# Guía de Validación (para pares y jurado)

Cómo reproducir y verificar los resultados del proyecto de forma independiente. Todo es
determinista (`random_state=42`); las cifras deben coincidir con las reportadas.

## 0. Requisitos

- **Node.js 24+** y **npm** (para la app web).
- **Python 3.12** (solo si se quieren regenerar datos/modelo).

---

## 1. Validar la app (5 minutos, sin Python)

```bash
npm install
npm run build      # tsc -b && vite build  → debe terminar en verde
npm run dev        # http://localhost:5173
```

**Qué verificar en el navegador:**
1. **Landing** (`/`) — el storytelling carga y anima de forma fluida (partículas se pausan al salir de vista).
2. **Dashboard** — filtros multi-selección, 6 gráficos y mapas responden; sección 2026 (boletín INS) vs. 2015–2025 (SIVIGILA individual).
3. **Simulador** — el mapa de riesgo por comuna carga, los **sliders de clima mueven el pronóstico**, el
   botón "Correr simulación" avanza 16 semanas, y aparecen alerta temprana + impacto económico.
4. **Modo "Tiempo real"** — toma clima de Open-Meteo (requiere red); si falla, cae a sliders.

> El modelo corre 100 % en el navegador (`onnxruntime-web`, wasm CPU). No hay backend que levantar.

---

## 2. Validar el modelo de IA (Python)

```bash
pip install -r requirements.txt
python ml/build_training_table.py     # -> ml/data/training_table.csv (10.267 filas)
python ml/train_model.py              # entrena + exporta public/data/model.onnx + model_meta.json
```

**Métricas esperadas** (impresas por `train_model.py` y guardadas en `ml/data/metrics.json`):

| Métrica | Valor esperado |
|---------|----------------|
| R² test (2024–2025, brote) | **≈ 0,571** |
| MAE test | **≈ 2,99** |
| R² baseline | **≈ −0,36** |
| Fidelidad sklearn ↔ ONNX | diff < 1e-6 |

**Ablación opcional** (`python ml/experiment_model.py`): confirma que Poisson empeora (R²≈0,49) y que el
contagio espacial no aporta (+0,003). Detalle en [`INFORME_MATEMATICO.md`](INFORME_MATEMATICO.md) §4.6.

---

## 3. Validar el re-anclaje a 2026

Requiere `data/boletin_santander_semanal.csv` (dato crudo del boletín INS, **no versionado**).

```bash
python scripts/build_nowcast_seed.py  # -> public/data/nowcast_2026.json (ancla 2026-S22)
```

**Prueba de credibilidad:** el script calibra `f_Bga = Bga/Santander` en 2024–2025 y lo aplica al Santander
2026; el resultado debe reproducir el **Bucaramanga real del boletín 2026 con ≈ −11 %** de error.

---

## 4. Validar los datos abiertos

- Fuentes, enlaces y licencias: [`05_FUENTES_DATOS_ABIERTOS.md`](05_FUENTES_DATOS_ABIERTOS.md).
- Diccionario de variables: [`data_dictionary.md`](data_dictionary.md).
- Los artefactos procesados están en `public/data/`; los CSV crudos viven en `data/` y **no** se versionan
  (ver `.gitignore`). Para regenerarlos: comandos en el [`README.md`](../README.md).

---

## 5. Checklist rápido de verificación

- [ ] `npm run build` termina en verde.
- [ ] La landing, el dashboard y el simulador cargan sin errores de consola.
- [ ] Los sliders de clima cambian visiblemente la curva del pronóstico.
- [ ] `python ml/train_model.py` reproduce R² ≈ 0,571.
- [ ] Las fuentes citadas en `docs/05_…` resuelven a portales de datos abiertos.
