# 🧠 Informe técnico — Simulador Predictivo de Dengue

> Cómo funciona, de punta a punta, la parte del **simulador** del proyecto EcoSalud IA.
> Archivos clave: [`src/features/simulator/forecast.ts`](../src/features/simulator/forecast.ts) (motor) y
> [`src/features/simulator/SimulatorView.tsx`](../src/features/simulator/SimulatorView.tsx) (interfaz).

---

## 1. Qué es y qué hace

El simulador responde a una pregunta: **"¿cómo podría evolucionar el dengue, comuna por comuna del Área Metropolitana, en las próximas 16 semanas, bajo un escenario climático que yo elijo?"**

El usuario:
1. Mueve tres sliders de clima (lluvia, temperatura, humedad).
2. Le da **play** y ve un mapa de calor por comuna que avanza semana a semana.
3. Lee un panel con el total proyectado, el pico, el ranking de comunas en riesgo y la curva metropolitana.

Todo ocurre **en el navegador**, sin backend ni llamadas a servidor. El modelo de IA viaja como un archivo y se ejecuta localmente.

---

## 2. Arquitectura en una frase

> El modelo se **entrena offline en Python**, se exporta a **ONNX** (~372 KB), y el navegador lo **ejecuta con `onnxruntime-web`** (WebAssembly). El simulador alimenta el modelo con features que él mismo arma, semana a semana, realimentando cada predicción.

```
Python (offline)                         Navegador (en vivo)
─────────────────                        ────────────────────
train_model.py                           SimulatorView.tsx  (UI, mapa, sliders)
  ├─ model.onnx        ──────►   fetch     │
  └─ model_meta.json   ──────►   fetch     ▼
                                          forecast.ts  (motor)
amb_municipios.geojson ────►   fetch       │  arma 16 features × comuna
amb_comunas.geojson    ────►   fetch       ▼
                                          onnxruntime-web (wasm)  → casos predichos
```

### ¿Por qué ONNX en el navegador?
- **Robustez en la demo en vivo:** no depende de WiFi ni de un servidor encendido. Si hay internet o no, el simulador funciona.
- **Costo cero de hosting:** se despliega como sitio estático en Vercel.
- **Privacidad/portabilidad:** el modelo es un archivo; cualquiera puede auditarlo.

### Detalle del WebAssembly (importante para mantenerlo)
- Usamos el backend **wasm en CPU** con `numThreads = 1`. Single-thread evita necesitar los headers `COOP/COEP` (que un hosting estático normal no manda) y el `SharedArrayBuffer`.
- El binario `ort-wasm-simd-threaded.wasm` (~11 MB) y su *glue* `ort-wasm-simd-threaded.mjs` viven en `src/features/simulator/ortwasm/` y se cargan con `?url` (Vite los emite como assets). Se versionan en git a propósito, para que el build offline funcione.
- No se pueden importar desde `node_modules/onnxruntime-web/dist` (el campo `exports` del paquete lo bloquea) ni desde `/public` (el dev server de Vite rechaza el `import()` dinámico de un `.mjs` que esté en `/public`). Por eso viven en `src/`.

---

## 3. El modelo: qué aprende y con qué

Modelo: **GradientBoosting** (sklearn) entrenado en `ml/train_model.py`. Es un **pronóstico autoregresivo con el clima como modulador**.

- **Objetivo (target):** `log1p(casos)` de la comuna en esa semana. Se usa `log1p` para comprimir la cola (semanas de brote con muchos casos) y estabilizar el entrenamiento. El frontend revierte con `expm1`.
- **16 features de entrada**, en este orden exacto (lo dicta `model_meta.json → feature_order`):

| # | Feature | Tipo | Qué es |
|---|---------|------|--------|
| 0 | `semana` | estacional | nº de semana epidemiológica (1–52) |
| 1 | `sin52` | estacional | `sin(2π·semana/52)` |
| 2 | `cos52` | estacional | `cos(2π·semana/52)` |
| 3 | `incidencia_base` | estática/comuna | casos históricos por 1000 hab |
| 4 | `log_pob` | estática/comuna | `log1p(población)` |
| 5 | `es_floridablanca` | estática/comuna | 1 si es Floridablanca, 0 si Bga |
| 6 | `precip` | clima | lluvia de la semana (slider) |
| 7 | `temp` | clima | temperatura (slider) |
| 8 | `humedad` | clima | humedad (slider) |
| 9 | `precip_acum8` | clima | lluvia acumulada 8 semanas |
| 10 | `temp_mean8` | clima | temperatura media 8 semanas |
| 11 | `humedad_mean8` | clima | humedad media 8 semanas |
| 12 | `casos_l1` | autoregresivo | casos de hace 1 semana |
| 13 | `casos_l2` | autoregresivo | casos de hace 2 semanas |
| 14 | `casos_l3` | autoregresivo | casos de hace 3 semanas |
| 15 | `casos_ma4` | autoregresivo | media de los últimos 4 |

- **Desempeño (validación temporal, test = brote 2024–2025):** R² = **+0.571**, MAE = **2.99 casos/semana**, contra un baseline climatológico de R² = −0.36. Es decir: generaliza al año epidémico difícil.

### El hallazgo honesto
Entrenado solo con clima, el modelo da R² ≈ −0.49 (peor que adivinar la media). **El clima por sí solo no predice el dengue.** Lo que sí predice es la **inercia epidémica** (los casos recientes: features 12–15). Por eso el simulador es autoregresivo y el clima entra como **modulador**, no como motor. Así funcionan los sistemas reales de alerta temprana — y por eso lo declaramos en la UI.

---

## 4. Los artefactos que carga el simulador

| Archivo | Para qué |
|---------|----------|
| `public/data/model.onnx` | el modelo entrenado, listo para inferencia |
| `public/data/model_meta.json` | "manual de instrucciones" del modelo (ver abajo) |
| `public/amb_comunas.geojson` | polígonos de las 25 comunas (relleno de riesgo) |
| `public/amb_municipios.geojson` | contorno disuelto por municipio (Bga / Florida) |

**`model_meta.json` es la pieza que conecta Python con el navegador.** Contiene:
- `feature_order`: el orden exacto de las 16 features (si Python y JS no coinciden, el modelo predice basura).
- `comunas`: las 25 comunas con `id`, `municipio`, `nombre`, `pob`, `incidencia_base`.
- `seed`: los **últimos 4 casos reales** de cada comuna (el estado inicial del pronóstico).
- `last_week`: la última semana observada por comuna (para saber desde dónde proyectar).
- `clima_ranges`: min/máx/mediana de cada variable de clima (para los rangos de los sliders).
- `metrics`: R²/MAE para mostrar en la UI.

---

## 5. El motor: `forecast.ts` paso a paso

### 5.1. Cargar el modelo una sola vez — `getSession()`
```ts
ort.env.wasm.numThreads = 1;
ort.env.wasm.wasmPaths = { wasm: wasmUrl, mjs: mjsUrl };
sessionPromise = ort.InferenceSession.create(`${baseUrl}data/model.onnx`);
```
Se guarda en una variable de módulo (`sessionPromise`) → el wasm y el modelo se cargan **una vez** aunque se llame muchas veces.

### 5.2. La idea del pronóstico recursivo
El modelo predice **una semana**. Para proyectar 16, encadenamos: la predicción de la semana *t* se convierte en el `casos_l1` de la semana *t+1*. Mantenemos un **historial** (`hist`) por comuna.

```ts
// Estado inicial = la semilla (últimos 4 casos reales, en orden cronológico)
for (const c of comunas) hist[c.id] = [...meta.seed[c.id]];   // p.ej. [c_t-3, c_t-2, c_t-1, c_t]
```

En cada semana `k` (1…16), para cada comuna, se leen los rezagos del final del historial:
```ts
const l1 = h[m-1];                              // el más reciente
const l2 = h[m-2];
const l3 = h[m-3];
const ma4 = (h[m-1]+h[m-2]+h[m-3]+h[m-4]) / 4;  // media de los últimos 4
```
Esto replica **exactamente** cómo `train_model.py` calculó esas features durante el entrenamiento (`shift(1/2/3)` y `shift(1).rolling(4).mean()`).

### 5.3. Armar las 16 features
- **Estacionales:** la semana avanza y envuelve en 52 (`semanaProyectada`), y de ahí salen `sin52`/`cos52`.
- **Estáticas por comuna:** `incidencia_base`, `log_pob` (calculado igual que en Python, redondeado a 3 decimales), `es_floridablanca`.
- **Clima (sliders) como escenario sostenido:** se asume que el clima elegido se mantiene en el horizonte, así:
  ```
  precip_acum8 = precip · 8        temp_mean8 = temp        humedad_mean8 = humedad
  ```
  Es una simplificación honesta y explicable: "¿y si el clima se viera así toda la temporada?".
- **Autoregresivas:** los `l1/l2/l3/ma4` del paso 5.2.

Las 25 comunas se empaquetan en **un solo tensor** `[25, 16]` (`Float32Array`).

### 5.4. Inferencia y vuelta a "casos"
```ts
const tensor = new ort.Tensor('float32', flat, [n, 16]);
const out = await session.run({ [inputName]: tensor });   // 1 inferencia para las 25 comunas
const logPred = out[outputName].data;                      // salida en espacio log1p

const casos = Math.max(0, Math.expm1(logPred[i]));         // revierte log1p y recorta negativos
hist[id].push(casos);                                      // ← realimentación: alimenta la semana siguiente
```
Resultado: `porComuna[id] = [casos_sem1, …, casos_sem16]` y `totalSemana[k]` (suma AMB por semana).

> **Costo:** 16 inferencias de un batch de 25 filas. Son milisegundos; por eso al mover un slider el mapa se recalcula casi al instante.

---

## 6. La interfaz: `SimulatorView.tsx`

### 6.1. Carga inicial (un `useEffect`)
Trae en paralelo: `model_meta.json`, los dos geojson y la sesión ONNX. Registra en ECharts un **mapa combinado** (ver §7) e inicializa los sliders en la **mediana** de cada variable de clima.

### 6.2. Recálculo del pronóstico (otro `useEffect`, con *debounce*)
Cuando cambian `meta` o el escenario `clima`, espera 180 ms y corre `correrPronostico`. El debounce evita recalcular en cada micro-movimiento del slider; solo recalcula cuando el usuario suelta/pausa.

### 6.3. Reproducción semana a semana
Un `useEffect` con `setInterval` (850 ms) que avanza `week` mientras `playing` sea true, y se detiene al llegar a la semana 16. Hay play/pause, reinicio y un slider manual de semana.

### 6.4. Valores derivados (`useMemo`)
- `maxCasos`: el máximo sobre todo el horizonte → **escala de color estable** (la leyenda no "salta" durante el play).
- `ranking`: comunas ordenadas por casos en la semana actual (top 6 en el panel).
- `totalActual`, `totalPico`, `semanaPico`: para los números grandes y el marcador de la curva.

---

## 7. El mapa de riesgo (lo más delicado de la UI)

Objetivo: mostrar el **riesgo coloreado por comuna** + un **contorno por ciudad** (Bucaramanga y Floridablanca) que se distinga, **sin** mostrar el borde de cada comuna y **sin** retardo al hacer zoom.

### Decisión clave: **una sola serie ECharts sobre un mapa combinado**
Se registra un único mapa con: los 2 polígonos de municipio + las 25 comunas, en un orden de dibujo específico:

```
fondo  →  [ Bucaramanga (municipio) ]   solo asoma su borde EXTERIOR (blanco)
medio  →  [ 25 comunas ]                rellenas por riesgo, reciben el hover
encima →  [ Floridablanca (municipio) ] contorno completo + frontera interna (morado)
```

- **Una sola serie ⇒ una sola transformación de roam ⇒ cero delay** entre relleno y contorno al hacer zoom/arrastrar. (Con dos series separadas, el contorno llegaba "tarde".)
- El **color del contorno** va en `data[].itemStyle.borderColor` (en una serie `map`, el estilo por región se pone en el dato, no en `regions` — eso último es del componente `geo`).
- Floridablanca va **encima** para que se vea su frontera interna con Bucaramanga; su dato lleva `silent: true`, así **no bloquea el hover** de las comunas que tiene debajo (ECharts deja pasar el evento).
- El `visualMap` (escala azul→rojo) solo colorea las comunas (los municipios no tienen `value`, así que los ignora).
- `RiskMap` usa `notMerge: false` para que, al avanzar de semana, se actualicen los datos **por merge** y **no se pierda el zoom** del usuario.

`amb_municipios.geojson` se genera con `scripts/build_municipios_outline.py`, que **disuelve** las comunas en un polígono por municipio (shapely `unary_union`). Tiene el mismo *bounding box* que el de comunas, por lo que ambas capas quedan perfectamente alineadas.

---

## 8. Lecciones de interpretación (para la sustentación)

- El simulador **no es una bola de cristal**: proyecta una dinámica de transmisión plausible bajo un escenario. Su valor es comparar escenarios y **priorizar comunas** (dónde concentrar fumigación/vigilancia), no dar una cifra exacta.
- Mover los sliders cambia el resultado de forma **realista pero moderada** (p. ej., más lluvia → menos casos por lavado de criaderos, dentro del rango de datos). La trayectoria la manda sobre todo la inercia epidémica.
- La nota "el clima es modulador, no motor" es un **punto a favor**, no una debilidad: demuestra honestidad metodológica y coincide con la literatura de alerta temprana.

---

## 9. Limitaciones conocidas

- **Profundidad temporal asimétrica:** Bucaramanga 2015–2025; Floridablanca 2023–2025. Las proyecciones de Florida se apoyan más en clima + estacionalidad.
- **Girón no se modela** (no publica comunas en datos abiertos).
- **Clima sostenido:** el escenario asume clima constante en el horizonte. Es una simplificación deliberada para que el control sea interpretable.
- **Bucaramanga desagregada por *share* espacial:** la curva de la ciudad se reparte entre comunas según la huella geocodificada, no es un conteo por comuna directo.

---

## 10. Cómo regenerarlo / extenderlo

```bash
# Reentrenar el modelo (regenera model.onnx + model_meta.json):
python ml/build_training_table.py
python ml/train_model.py

# Regenerar el contorno de municipios (si cambian los geojson de comunas):
python scripts/build_municipios_outline.py    # requiere shapely
```
- Cambiar el **horizonte**: la constante `HORIZONTE` en `SimulatorView.tsx`.
- Cambiar el **ancla temporal** de las etiquetas: la constante `ANCHOR`.
- Si se actualiza `onnxruntime-web`: recopiar `ort-wasm-simd-threaded.{wasm,mjs}` desde `node_modules/onnxruntime-web/dist/` a `src/features/simulator/ortwasm/`.

> ⚠️ Si se reentrena el modelo y cambia el `feature_order`, **no hay que tocar nada manualmente** en `forecast.ts` salvo que cambien las features: el orden de las 16 columnas en el `Float32Array` debe coincidir con `feature_order`. Hoy están hardcodeadas en ese orden por velocidad.
