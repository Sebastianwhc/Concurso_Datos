# 🎤 Guion del Pitch — EcoSalud IA (máx. 15 min)

**Formato:** la presentación **es la landing** (`https://concursodatos.vercel.app`). Se hace *scroll* por los
actos mientras se narra. Este guion mapea la estructura de evaluación (6 partes) a lo que se ve en pantalla.

> **Regla de oro:** habla a la **historia y al impacto**, deja que los números de la landing hagan el resto.
> Sé honesto con las fronteras del dato: eso suma rigor, no resta.

### ⏱️ Presupuesto de tiempo (14–15 min)
| # | Parte | Sección de la landing | Tiempo |
|---|-------|----------------------|--------|
| 1 | Proyecto | Hero | 1:30 |
| 2 | Problema | La Amenaza (actos 1–4) | 2:30 |
| 3 | Datos abiertos | Territorio + footer (narrado) | 2:30 |
| 4 | IA / Analítica | Simulador (mockup + explicación) | 3:30 |
| 5 | Resultados | Simulador (correr en vivo + métricas) | 2:30 |
| 6 | Impacto | Impacto Económico + CTA | 2:00 |
| — | Cierre / preguntas | CTA | 0:30 |

---

## 1 · PROYECTO — *(Hero · 1:30)*
**🖥️ Pantalla:** portada. Título *"No podemos detener el clima. Pero podemos anticipar la epidemia."*

**🎙️ Guion:**
> "Buenas. Somos el equipo de **EcoSalud IA**. Les presentamos el **primer simulador predictivo de dengue
> impulsado por Inteligencia Artificial para el Área Metropolitana de Bucaramanga**.
>
> El dengue no lo controla el calendario ni el clima: lo controla **qué tan pronto actuamos**. Nuestra
> herramienta anticipa la epidemia **comuna por comuna y semana a semana**, usando **datos abiertos** y un
> modelo de IA que —esto es clave— **corre dentro del navegador, sin servidores**. Lo que van a ver en los
> próximos minutos es la herramienta real, funcionando en vivo."

**💡 Tip:** no te quedes en el Hero. Una frase de gancho y baja. Menciona ya las 3 palabras fuerza:
*predictivo, datos abiertos, en el navegador.*

---

## 2 · PROBLEMA — *(La Amenaza · 2:30)*
**🖥️ Pantalla:** *scroll* por los actos de "La Amenaza": el número grande del brote, el impacto clínico.

**🎙️ Guion:**
> "El problema es que hoy la respuesta al dengue es **reactiva**: se actúa cuando el brote ya explotó en las
> cifras, cuando la ventana de control más costo-efectiva ya se cerró.
>
> Y el brote es real. En **2024, Bucaramanga vivió su mayor brote: 11.541 casos** — un número que
> confirman **dos fuentes independientes**, el registro clínico y el boletín del INS. Ese año hubo
> **3.572 hospitalizaciones, 91 casos graves y 11 muertes**.
>
> ¿Y hoy? La amenaza sigue viva: en **2026 ya van 1.098 casos reales** en Bucaramanga según el boletín del INS.
> Detrás de cada número hay una persona, una familia, un servicio de salud bajo presión."

**💡 Tip:** aquí generas la urgencia. Apóyate en el número grande (11.541) y en el "sigue vivo en 2026".
Honestidad: 2024 fue *el* brote; 2025/2026 son años más normales — no lo escondas, es parte del patrón.

---

## 3 · DATOS ABIERTOS — *(Territorio + footer · 2:30)*
**🖥️ Pantalla:** sección **Territorio** (los mapas del AMB / Santander). Al final, puedes bajar al **footer**
que lista las fuentes.

**🎙️ Guion:**
> "Todo esto se construye sobre **datos abiertos**. Nuestras fuentes:
> - **Datos abiertos del INS en datos.gov.co**: dengue por municipio de Santander — el dataset masivo que
>   cumple el requisito de datos abiertos.
> - **Boletín epidemiológico del INS**, para la situación 2026 al día.
> - **DANE — Marco Geoestadístico Nacional**, para la base geográfica de municipios y del área metropolitana.
> - **IDEAM y CDMB**, para el clima semanal 2007–2026: precipitación, temperatura y humedad.
> - **Geoportales oficiales del AMB y Floridablanca**, para las comunas.
>
> Para la **profundidad clínica** —demografía, síntomas, severidad— usamos un **registro individual de
> 28.626 casos con 76 variables (2015–2025)**, obtenido por **convenio con la Clínica FOSCAL**. Es un dato
> semiprivado, así que **solo publicamos versiones agregadas y anonimizadas** — nunca microdatos de pacientes.
>
> **Tratamiento:** todo se procesa **offline en Python** —limpieza, geocodificación por comuna, unificación
> del clima en serie semanal— y se publica como **artefactos compactos** que el navegador consume. El CSV
> nacional de 218 MB nunca llega al usuario."

**💡 Tip (rigor + honestidad):** deja clarísimo que el **cumplimiento de "datos abiertos" descansa en
datos.gov.co / INS / DANE / IDEAM**, y que FOSCAL es la capa de profundidad **semiprivada y anonimizada**.
Si un jurado pregunta, ya lo dijiste tú primero: eso es rigor.

**🔎 Variables (si preguntan):** el modelo usa **16 variables** en 3 grupos → estacionalidad (semana,
seno/coseno, población, incidencia base), **clima** (precip/temp/humedad + acumulados), y **autoregresivas**
(casos de las últimas semanas). Diccionario completo en `docs/data_dictionary.md`.

---

## 4 · IA / ANALÍTICA — *(Simulador · 3:30)*
**🖥️ Pantalla:** sección **Simulador** (el mockup con "Gradient Boosting · ONNX en el navegador").

**🎙️ Guion:**
> "El corazón es un modelo de **Gradient Boosting** entrenado en Python y exportado a **ONNX**: pesa
> **372 KB y corre 100 % en el navegador** con WebAssembly. Sin backend, sin conexión: la demo no se cae.
>
> El enfoque es lo interesante. Descubrimos algo contraintuitivo: **el clima por sí solo NO predice el
> dengue**. La verdadera señal está en la **inercia epidémica** —los casos de las semanas recientes—. Así
> que el modelo hace un **pronóstico autoregresivo**: predice la próxima semana, realimenta el resultado y
> avanza el horizonte **16 semanas**, con el **clima como modulador**. Exactamente como funcionan los
> sistemas de alerta temprana reales.
>
> Y no se queda en la curva: **traduce el pronóstico en acción** —clasifica cada comuna por riesgo y
> recomienda medidas de control priorizadas— y en **pesos**. Además tiene un **modo tiempo real** que toma el
> clima actual de Bucaramanga vía una API abierta."

**💡 Tip:** este es tu bloque técnico fuerte. La frase que debe quedar: *"el clima modula, pero la inercia
epidémica predice"* — demuestra que entienden el fenómeno, no solo que entrenaron un modelo.

---

## 5 · RESULTADOS — *(Simulador en vivo + métricas · 2:30)*
**🖥️ Pantalla:** **mueve los sliders de clima** y pulsa **"Correr simulación"**. Muestra la métrica **R²=0,57**
y, si está, el **backtest 2024**.

**🎙️ Guion:**
> "Veámoslo funcionar. Subo la precipitación… y el pronóstico reacciona: el mapa de riesgo por comuna cambia,
> el pico proyectado se mueve. Esto es el modelo corriendo aquí, en el navegador, en tiempo real.
>
> ¿Y confían en él? Lo validamos **de la forma más dura posible**: entrenamos con datos **hasta 2023** y le
> pedimos predecir el **año epidémico 2024, a ciegas**. Resultado: **R² de 0,57**, frente a un baseline
> negativo. En el **backtest del brote 2024**, arrancando en febrero sin ver nada más, **reprodujo la
> trayectoria ascendente del brote** — conservador, subestima el pico un 17 %, pero acierta la dirección y la
> magnitud.
>
> Y para presentar en 2026, re-anclamos el modelo al boletín del INS: nuestra calibración **predijo el
> Bucaramanga real de 2026 con solo 11 % de error**. Eso valida el método."

**💡 Tip:** el argumento ganador es *"lo validamos contra el brote real 2024, a ciegas"*. La honestidad del
"subestima 17 %" **suma credibilidad**: no estás vendiendo un modelo mágico.

---

## 6 · IMPACTO — *(Impacto Económico + CTA · 2:00)*
**🖥️ Pantalla:** sección **Impacto Económico**, luego el **CTA** de cierre.

**🎙️ Guion:**
> "¿Por qué importa? Porque el dengue **también cuesta dinero**. Cada caso cuesta cerca de **$1,4 millones**;
> el brote de 2024 le costó a Bucaramanga alrededor de **$16.000 millones de pesos**.
>
> Nuestra herramienta convierte el pronóstico en una decisión: al **actuar temprano** en las comunas que el
> modelo marca en rojo, el ahorro potencial está entre **$1.600 y $4.800 millones**. Salud pública que además
> es eficiencia del gasto.
>
> En resumen: **datos abiertos + IA en el navegador** para pasar de **reaccionar** a **anticipar** el dengue
> en Bucaramanga. Predicción, acción y ahorro, en una sola herramienta que pueden usar hoy. Gracias —
> ¿preguntas?"

**💡 Tip:** cierra con la frase-tesis: *"de reaccionar a anticipar"*. Es lo que quieres que el jurado recuerde.

---

## 🛡️ Preguntas probables (prepara estas)
- **"¿Por qué Gradient Boosting y no deep learning?"** → Con este volumen de datos, GBM es más robusto y, sobre
  todo, **se exporta fiel a ONNX** para correr en el navegador. El techo de precisión está **en el dato**
  (Bucaramanga desagregada por *share*), no en el algoritmo — lo probamos con ablaciones.
- **"¿El dato individual es abierto?"** → No. El registro individual es de **convenio con FOSCAL** (semiprivado);
  publicamos solo agregados anonimizados. El **cumplimiento de datos abiertos** es con datos.gov.co, INS, DANE,
  IDEAM, CDMB y GIS.
- **"¿Y Floridablanca / Girón?"** → Bucaramanga es el ancla (serie profunda). Floridablanca se **estima** con
  una fracción validada; Girón no publica comunas abiertas → se muestra por burbujas. Todo declarado.
- **"¿Funciona sin internet?"** → Sí. El modelo corre en el navegador; solo el *modo tiempo real* (clima)
  necesita red, y si falla, cae a los sliders.

## ✅ Checklist técnico antes de presentar
- [ ] Abrir la landing en **Chrome** (mejor rendimiento de blur en Mac) y probar el scroll completo.
- [ ] Verificar que el **simulador corre** y los **sliders mueven** el pronóstico.
- [ ] Tener la landing **ya cargada** (para que el modelo ONNX esté en caché) antes de empezar.
- [ ] Plan B: si no hay internet, la herramienta igual corre; solo evita el *modo tiempo real*.
