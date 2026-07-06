# Planteamiento del Problema

## 1. El problema

El **dengue** es la principal arbovirosis de Colombia y una carga sanitaria recurrente en el
**Área Metropolitana de Bucaramanga (AMB)**. Su transmisión depende del mosquito *Aedes aegypti*,
cuya población responde a **condiciones climáticas** (temperatura, lluvia, humedad) y se concentra en
**patrones espaciales** (comunas) que se repiten año tras año. El resultado son **brotes epidémicos**
—como el de 2024— que saturan los servicios de salud de forma súbita.

El obstáculo operativo no es la falta de datos, sino que la respuesta es **reactiva**: las autoridades
actúan *cuando el brote ya es visible* en las cifras. Para entonces, la ventana de control vectorial
(fumigación, eliminación de criaderos) más costo-efectiva ya se cerró.

## 2. Pregunta que resuelve el proyecto

> **¿Podemos anticipar, semana a semana y comuna por comuna, hacia dónde va el dengue en el AMB —
> con datos abiertos— para pasar de una respuesta reactiva a una preventiva?**

No pretendemos "predecir el clima" ni eliminar la incertidumbre epidemiológica. Pretendemos entregar
una **señal de alerta temprana accionable**: un pronóstico a 16 semanas que traduzca los datos en
**dónde actuar primero** y **cuánto se ahorra** al hacerlo a tiempo.

## 3. Objetivos

**General.** Construir un simulador predictivo de dengue para el AMB, alimentado con datos abiertos,
que proyecte casos por comuna y cierre el ciclo **predicción → acción → impacto económico**.

**Específicos.**
1. Consolidar y depurar los datos abiertos de vigilancia (SIVIGILA), clima (IDEAM/CDMB) y geografía (GIS oficial).
2. Entrenar un modelo de IA que capture la **inercia epidémica** (autoregresión) modulada por el clima.
3. Validar el modelo contra un **año epidémico real** (brote 2024) con partición temporal honesta.
4. Desplegar el modelo **en el navegador** (sin backend) para una demo robusta y reproducible.
5. Traducir el pronóstico en **recomendaciones de control** priorizadas y en **impacto económico** (COP).

## 4. Alcance y delimitación

- **Territorio:** AMB, con **Bucaramanga como ancla** (serie profunda 2015–2025). Floridablanca y Girón se
  suman en la capa espacial con la profundidad de dato disponible (2023–2025).
- **Horizonte:** pronóstico recursivo de **16 semanas**, re-anclado a 2026 con el boletín del INS.
- **Naturaleza:** herramienta de **apoyo a la decisión**, no un dispositivo de diagnóstico clínico ni un
  sistema de vigilancia oficial. Ver límites y ética en [`public_impact_assessment.md`](public_impact_assessment.md).

## 5. Por qué importa (justificación)

- **Salud pública:** adelantar la respuesta ataca el brote en su fase de crecimiento, cuando el control
  vectorial rinde más.
- **Económica:** cada caso tiene un costo directo e indirecto (ver [`06_IMPACTO_ECONOMICO.md`](06_IMPACTO_ECONOMICO.md));
  anticipar reduce hospitalizaciones y días de trabajo perdidos.
- **Equidad territorial:** priorizar por comuna dirige recursos limitados a donde más se necesitan.

El encuadre metodológico completo (CRISP-ML(Q)) está en [`01_METODOLOGIA_CRISP-ML.md`](01_METODOLOGIA_CRISP-ML.md).
