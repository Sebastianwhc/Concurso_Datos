# 📐 Informe matemático — del dato crudo a la predicción

> Qué se hizo, **matemáticamente**, con cada dataset y en cada paso del proceso.
> Acompaña a [`INFORME_SIMULADOR.md`](INFORME_SIMULADOR.md) (que explica el *cómo* del código).
> Notación: $t$ = índice de semana, $c$ = comuna, $\hat{y}$ = predicción.

---

## 0. Mapa del proceso

```
DATOS CRUDOS          →   PREPARACIÓN          →   TABLA DE ENTRENAMIENTO   →   MODELO        →   PRONÓSTICO
(SIVIGILA, nacional,      (decodificar,            (feature engineering:        (Gradient         (recursión
 direcciones, IDEAM,      geocodificar,            lags, clima, share,          Boosting →        autoregresiva
 CDMB, GIS)               agregar a semanal)       incidencia, log1p)           ONNX)             en el navegador)
```

Hay **cinco datasets** que se funden en **una sola matriz** $X \in \mathbb{R}^{N\times 16}$ con un objetivo $y \in \mathbb{R}^N$ ($N = 10{,}267$ filas = comuna × semana).

---

## 1. Los datasets y su matemática de preparación

### 1.1. SIVIGILA individual de Bucaramanga → curva semanal de la ciudad
- **Crudo:** 28.626 registros individuales (un caso por fila), 76 variables, 2015–2025.
- **Uso:** se cuenta cuántos casos hay por semana epidemiológica. Si $\mathbb{1}[\cdot]$ es el indicador,

$$ C_t \;=\; \sum_{i=1}^{28626} \mathbb{1}[\text{semana}(i) = t] $$

Esto da la **curva semanal de la ciudad** $C_t$ (casos de Bucaramanga en la semana $t$). Es la espina dorsal temporal del modelo.

### 1.2. Archivo nacional SIVIGILA → Santander por municipio
- **Crudo:** 2,46 millones de filas (todo Colombia). *Nunca llega al navegador* (218 MB).
- **Uso (offline):** se filtra Santander y se agrega por municipio y año → `santander_dengue.json` (contexto del dashboard, 2007–2022). Pura suma de conteos por grupo.

### 1.3. Direcciones (Reporte Salud Pública) → coordenadas → comuna
Aquí hay dos operaciones matemáticas interesantes.

**(a) Geocodificación.** Cada dirección de texto se manda a Nominatim/OSM y devuelve $(\text{lon}, \text{lat})$. Resultado: 6.703/8.365 casos ubicados (80%).

**(b) Asignación a comuna — algoritmo *point-in-polygon* (ray casting).** Para saber a qué comuna pertenece un punto $(x,y)$, se lanza un rayo horizontal y se cuentan los cruces con los lados del polígono. Para cada arista $(x_i,y_i)\!\to\!(x_j,y_j)$:

$$ \text{cruza} \iff (y_i > y) \neq (y_j > y) \;\;\wedge\;\; x < \frac{(x_j-x_i)(y - y_i)}{y_j - y_i} + x_i $$

Si el nº total de cruces es **impar**, el punto está **dentro**. (Es el `pip()` de `geocode_metro.py` / `build_training_table.py`.)

Con esto se obtiene, por comuna $c$, el total geocodificado $G_c$ (que alimenta el *share* y la incidencia, §2).

### 1.4. Clima: IDEAM + CDMB → serie semanal
Tres variables (precipitación, temperatura, humedad) desde fuentes heterogéneas, unificadas a **semana ISO**.

**Paso 1 — diario, media entre estaciones.** Para un día $d$ con estaciones $s=1..S$:

$$ v_d \;=\; \frac{1}{S}\sum_{s=1}^{S} v_{d,s} $$

**Paso 2 — agregación semanal.** Según la variable:

$$ \text{precip}_t = \sum_{d \in t} v_d \quad(\text{acumulada}); \qquad \text{temp}_t,\ \text{humedad}_t = \frac{1}{|t|}\sum_{d \in t} v_d \quad(\text{media}) $$

**Paso 3 — corrección de altitud de la temperatura.** La estación del valle (Palonegro) termina en 2019; se continúa con Mogotes (más alta, por tanto más fría). Se mide el **desfase medio** en el periodo de solape $O$ y se corrige:

$$ \delta \;=\; \frac{1}{|O|}\sum_{k \in O}\big(T^{\text{Palonegro}}_k - T^{\text{Mogotes}}_k\big) \approx +2.2^\circ\text{C}, \qquad T^{\text{valle}}_k = T^{\text{Mogotes}}_k + \delta $$

**Paso 4 — climatología (línea base estacional).** Promedio de cada variable sobre todos los años para cada semana del año $s\in\{1,\dots,53\}$:

$$ \bar{v}_s \;=\; \frac{1}{|\mathcal{Y}_s|}\sum_{y \in \mathcal{Y}_s} v_{(y,s)} $$

Esta climatología es lo que define los **rangos de los sliders** y el **baseline** de validación.

### 1.5. GIS de comunas → contorno por municipio (disolución)
La unión geométrica de los polígonos de las comunas de un municipio:

$$ \text{Municipio}_m \;=\; \bigcup_{c \in m} \text{Polígono}_c $$

(shapely `unary_union`). Borra las fronteras internas y deja una sola línea por ciudad. Solo es para dibujar; no entra al modelo.

---

## 2. Construcción de la tabla de entrenamiento (feature engineering)

Cada fila es un par (comuna $c$, semana $t$). El objetivo y las 16 columnas se definen así.

### 2.1. El objetivo: casos por comuna-semana
- **Floridablanca:** conteo geocodificado real $y^{\text{real}}_{c,t}$ (direcciones → comuna → semana).
- **Bucaramanga (desagregación espacial):** no hay conteo por comuna en el histórico largo, así que la curva de la **ciudad** $C_t$ se reparte entre comunas según su **huella espacial** (*share*). Con $G_c$ = casos geocodificados de la comuna $c$:

$$ \text{share}_c \;=\; \frac{G_c}{\sum_{c'\in \text{Bga}} G_{c'}}, \qquad y_{c,t} \;=\; C_t \cdot \text{share}_c $$

> Supuesto clave: la **distribución espacial** del dengue dentro de Bucaramanga es aproximadamente estable en el tiempo. Es una aproximación (declarada en los caveats), no un conteo directo.

### 2.2. La transformación del objetivo: `log1p`
Se modela $y' = \log(1+y)$ en vez de $y$. Razones matemáticas:
- Los casos son conteos **no negativos y muy sesgados** (semanas de brote con colas largas). $\log(1+y)$ comprime esa cola → el error cuadrático no queda dominado por los picos.
- $\log(1+\cdot)$ está definido en $y=0$ (a diferencia de $\log y$).
- La inversa exacta es $y = e^{y'}-1 = \text{expm1}(y')$, que el navegador aplica al final.

### 2.3. Las 6 features estáticas / estacionales

| Feature | Fórmula | Idea |
|---|---|---|
| `incidencia_base` $I_c$ | $\displaystyle 1000\cdot\frac{G_c}{\text{pob}_c}$ | riesgo histórico por 1000 hab |
| `log_pob` | $\log(1+\text{pob}_c)$ | tamaño poblacional (escala comprimida) |
| `es_floridablanca` | $\mathbb{1}[c\in\text{Florida}]$ | desplazamiento por ciudad |
| `semana` | $s\in[1,52]$ | nº de semana |
| `sin52` | $\sin(2\pi s/52)$ | estacionalidad (continua y cíclica) |
| `cos52` | $\cos(2\pi s/52)$ | estacionalidad (cuadratura) |

> El truco $\sin/\cos$ codifica el tiempo cíclico: la semana 52 y la 1 quedan **adyacentes** en el círculo unitario, cosa que el número crudo "52→1" no logra.

### 2.4. Las 6 features de clima (de la semana y rezagadas)
De la semana actual: $\text{precip}_t,\ \text{temp}_t,\ \text{humedad}_t$. Y **ventanas de las 8 semanas previas** (clima sostenido / acumulado), con $l$ = rezago:

$$ \text{precip\_acum8}_t = \sum_{l=1}^{8}\text{precip}_{t-l}, \qquad \text{temp\_mean8}_t = \frac{1}{8}\sum_{l=1}^{8}\text{temp}_{t-l}, \qquad \text{humedad\_mean8}_t = \frac{1}{8}\sum_{l=1}^{8}\text{humedad}_{t-l} $$

> El rezago de 8 semanas captura que entre la lluvia y el caso de dengue median el ciclo del mosquito + el periodo de incubación (semanas, no días).

### 2.5. Las 4 features autoregresivas (el corazón del modelo)
Con los casos pasados de la misma comuna:

$$ \text{casos\_l1}=y_{c,t-1},\quad \text{casos\_l2}=y_{c,t-2},\quad \text{casos\_l3}=y_{c,t-3},\quad \text{casos\_ma4}=\frac{1}{4}\sum_{l=1}^{4}y_{c,t-l} $$

En el código de entrenamiento esto es `groupby(comuna).shift(1/2/3)` y `shift(1).rolling(4).mean()`.

---

## 3. El modelo: Gradient Boosting (la matemática)

Se entrena un **`GradientBoostingRegressor`** (sklearn) para aproximar

$$ F(x) \approx \mathbb{E}[\,y' \mid x\,], \qquad y' = \log(1+y) $$

donde $x\in\mathbb{R}^{16}$ es el vector de features.

### 3.1. Modelo aditivo de árboles
La predicción es una suma de $M$ árboles de regresión $h_m$ (cada uno "débil", profundidad 4):

$$ F_M(x) \;=\; F_0 \;+\; \nu \sum_{m=1}^{M} \gamma_m\, h_m(x) $$

- $F_0$ = constante inicial (la media de $y'$).
- $\nu = 0.04$ = **learning rate** (shrinkage): pasos pequeños = menos sobreajuste.
- $M = 400$ = nº de árboles (`n_estimators`).

### 3.2. Cómo se construye cada árbol (boosting por gradiente)
Con pérdida de error cuadrático $L(y',F)=\tfrac12 (y'-F)^2$, en la etapa $m$:

1. **Pseudo-residuales** = gradiente negativo de la pérdida (para MSE, es simplemente el residuo):

$$ r_i^{(m)} \;=\; -\left[\frac{\partial L(y'_i,F)}{\partial F}\right]_{F=F_{m-1}(x_i)} \;=\; y'_i - F_{m-1}(x_i) $$

2. **Se ajusta un árbol** $h_m$ a esos residuales (el árbol aprende *dónde se está equivocando* el modelo hasta ahora).
3. **Valor óptimo por hoja** $\gamma_m$ (line search; para MSE es la media de los residuos en la hoja).
4. **Actualización con shrinkage:** $F_m = F_{m-1} + \nu\,\gamma_m h_m$.

### 3.3. Ingredientes estocásticos / de regularización
- `subsample = 0.85`: cada árbol se ajusta sobre un **85 % aleatorio** de las filas (Stochastic Gradient Boosting de Friedman) → reduce varianza.
- `max_depth = 4`: árboles poco profundos → capturan interacciones de bajo orden, evitan memorizar.
- `min_samples_leaf = 20`: cada hoja con ≥20 ejemplos → predicciones estables.
- `random_state = 42`: reproducibilidad.

### 3.4. Por qué GradientBoosting (y no XGBoost)
Mismo tipo de modelo (ensamble de árboles con boosting), pero el de sklearn **se exporta fiel a ONNX** con `skl2onnx`; XGBoost rompía la conversión. Se verificó: $\max|\,F_{\text{sklearn}} - F_{\text{ONNX}}\,| \approx 10^{-6}$ (idénticos a efectos prácticos).

### 3.5. La predicción final (volver a "casos")
$$ \boxed{\;\hat{y} \;=\; \max\!\big(0,\; \text{expm1}(F_M(x))\big) \;=\; \max\!\big(0,\; e^{F_M(x)} - 1\big)\;} $$

El `max(0,·)` recorta predicciones negativas (no existen "casos negativos").

---

## 4. Validación (cómo sabemos que sirve)

### 4.1. Partición temporal (no aleatoria)
$$ \text{Train} = \{t : \text{año}\le 2023\}, \qquad \text{Test} = \{t : \text{año}\ge 2024\} $$

Se entrena con el pasado y se prueba con el **futuro** (2024–2025, que fue **año epidémico**). Esto es mucho más exigente que una partición aleatoria, y evita "ver el futuro".

### 4.2. Métricas (con fórmulas)
Con $n$ ejemplos de test, $y_i$ real, $\hat{y}_i$ predicho, $\bar{y}$ media:

$$ \text{MAE} = \frac{1}{n}\sum_i |y_i-\hat{y}_i|, \quad \text{RMSE} = \sqrt{\frac{1}{n}\sum_i (y_i-\hat{y}_i)^2}, \quad R^2 = 1 - \frac{\sum_i (y_i-\hat{y}_i)^2}{\sum_i (y_i-\bar{y})^2} $$

$R^2$ compara el error del modelo contra el de "predecir siempre la media". $R^2=1$ perfecto; $R^2=0$ igual que la media; $R^2<0$ **peor** que la media.

### 4.3. Baseline contra el que se compara
La **climatología por comuna-semana**: predecir para $(c,s)$ el promedio histórico de esa comuna en esa semana del año,

$$ \hat{y}^{\text{base}}_{c,s} = \frac{1}{|\mathcal{Y}|}\sum_{y\in\mathcal{Y}} y_{c,(y,s)} $$

### 4.4. Resultados

| Modelo | MAE | RMSE | $R^2$ |
|---|---|---|---|
| Baseline (climatología) | 7.36 | 12.01 | **−0.36** |
| GradientBoosting (AR + clima) | **2.99** | **6.74** | **+0.571** |

El baseline tiene $R^2<0$: en un año de brote, "el promedio histórico" predice peor que la media. El modelo **sí generaliza al brote**.

### 4.5. Importancia por permutación
Para medir cuánto aporta cada feature, se **baraja** aleatoriamente esa columna y se mide cuánto empeora el $R^2$:

$$ \text{Importancia}(j) \;=\; R^2(X) - \mathbb{E}\big[R^2(X^{\text{perm}(j)})\big] $$

Resultado: dominan las features **autoregresivas** (`casos_l*`, `casos_ma4`). De ahí el hallazgo de §6.

---

## 5. El pronóstico recursivo (lo que corre en el navegador)

El modelo predice **una** semana. Para proyectar $H=16$, se encadena (autoregresión): la predicción se realimenta como rezago de la siguiente.

### 5.1. Estado inicial (la semilla)
Para cada comuna se guardan los **últimos 4 casos reales** observados (de `model_meta.json → seed`):

$$ \mathbf{h}_c^{(0)} \;=\; \big[\,y_{c,T-3},\ y_{c,T-2},\ y_{c,T-1},\ y_{c,T}\,\big] $$

donde $T$ es la última semana observada (`last_week`).

### 5.2. La recursión
Para $k=1,\dots,16$, en cada comuna se arma el vector $x_{c}^{(k)}$ con:
- **AR (del historial):** $l_1=h_{-1},\ l_2=h_{-2},\ l_3=h_{-3},\ \text{ma4}=\tfrac14\sum_{j=1}^{4}h_{-j}$.
- **Estacional:** la semana avanza con envoltura, $s_k = ((T + k - 1)\bmod 52)+1$, y de ahí $\sin/\cos$.
- **Estáticas:** $I_c,\ \log\text{pob}_c,\ \mathbb{1}[\text{Florida}]$.
- **Clima (escenario):** ver §5.3.

Se predice y se realimenta:

$$ \hat{y}_{c}^{(k)} \;=\; \max\!\big(0,\ \text{expm1}(F(x_c^{(k)}))\big), \qquad \mathbf{h}_c^{(k)} \;=\; \big[\,\mathbf{h}_c^{(k-1)},\ \hat{y}_c^{(k)}\,\big] $$

La predicción de hoy es el `casos_l1` de mañana. **Una inferencia ONNX por semana** procesa las 25 comunas a la vez (tensor $25\times 16$).

### 5.3. El clima como escenario sostenido
Los sliders fijan $(\text{precip}^\*,\text{temp}^\*,\text{humedad}^\*)$ y se asumen **constantes** en todo el horizonte. Entonces las ventanas de 8 semanas colapsan a:

$$ \text{precip\_acum8} = 8\cdot\text{precip}^\*, \qquad \text{temp\_mean8} = \text{temp}^\*, \qquad \text{humedad\_mean8} = \text{humedad}^\* $$

Interpretación: *"¿qué pasaría si el clima se mantuviera así toda la temporada?"*. Simplificación deliberada para que el control sea interpretable.

---

## 6. La conclusión matemática (el hallazgo honesto)

Tres hechos cuantitativos sostienen la tesis **"el clima es modulador, no motor"**:

1. **Modelo solo-clima:** $R^2 \approx -0.49$ → el clima por sí solo predice **peor que la media**.
2. **Modelo solo-climatología (baseline):** $R^2 = -0.36$ → la estacionalidad sola tampoco basta en un brote.
3. **Modelo AR + clima:** $R^2 = +0.571$, y la **importancia por permutación** la dominan los rezagos de casos.

> Conclusión: la señal predictiva fuerte es la **inercia epidémica** (autocorrelación temporal de los casos). El clima aporta una modulación de segundo orden — realista, medible, pero no el motor. Por eso el simulador es **autoregresivo** con el clima como **modulador**, y por eso los sliders mueven el resultado de forma notable pero acotada. Esto coincide con cómo operan los sistemas reales de alerta temprana de dengue.

---

## 7. Resumen en una página

| Etapa | Operación matemática central |
|---|---|
| SIVIGILA → curva ciudad | conteo por semana: $C_t=\sum_i \mathbb{1}[\text{sem}(i)=t]$ |
| Direcciones → comuna | geocodificación + point-in-polygon (paridad de cruces) |
| Clima → semanal | media entre estaciones; suma/media semanal; corrección $+\delta$; climatología |
| Bga → comunas | desagregación por share: $y_{c,t}=C_t\cdot \text{share}_c$ |
| Objetivo | $y'=\log(1+y)$ |
| Features | $\sin/\cos$ estacional, lags, ventanas de 8 sem, incidencia, $\log$pob |
| Modelo | $F_M=F_0+\nu\sum_m\gamma_m h_m$, boosting de gradiente (MSE) |
| Predicción | $\hat{y}=\max(0,\ e^{F_M(x)}-1)$ |
| Validación | split temporal; MAE/RMSE/$R^2$; baseline climatológico |
| Pronóstico | recursión AR: $\hat{y}^{(k)}\!\to\! l_1^{(k+1)}$; clima sostenido |
