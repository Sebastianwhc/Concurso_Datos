# Evaluación de Impacto Público, Ética y Mitigación de Sesgos

Este documento responde al criterio de **impacto y responsabilidad** del nivel Avanzado: qué bien
puede hacer la herramienta, qué daños podría causar y cómo los mitigamos.

## 1. Impacto público esperado

| Dimensión | Impacto |
|-----------|---------|
| **Salud pública** | Adelantar el control vectorial a la fase de crecimiento del brote, cuando es más costo-efectivo. |
| **Económico** | Reducir hospitalizaciones y días laborales perdidos. Con acción temprana estimamos un ahorro potencial ~20 % del costo proyectado (ver [`06_IMPACTO_ECONOMICO.md`](06_IMPACTO_ECONOMICO.md)). |
| **Equidad territorial** | La priorización por comuna dirige recursos limitados a las zonas de mayor riesgo. |
| **Transparencia** | Datos abiertos + código abierto + fronteras de incertidumbre declaradas = decisiones auditables. |

## 2. Uso responsable y límites

- Es una **herramienta de apoyo a la decisión**, **no** un dispositivo de diagnóstico clínico ni un
  sistema de vigilancia oficial. Las decisiones sanitarias siguen en manos de las autoridades.
- El pronóstico es **probabilístico y conservador**; debe leerse junto a la vigilancia epidemiológica.
- La frontera **observado → estimado → pronóstico** se muestra explícitamente para no confundir dato
  con predicción.

## 3. Privacidad y protección de datos

- **No se publican datos personales identificables.** El registro individual proviene de un **convenio con
  la Clínica FOSCAL** (semiprivado) y se usa **solo para producir estadísticas y features agregadas**; el
  artefacto publicado (`dengue.json`) contiene **casos sin identificadores** (año, semana, sexo, grupo
  etario, estrato, severidad…), nunca nombres, documentos ni direcciones exactas.
- **Base legal del registro individual:** convenio institucional con la FOSCAL. Al no ser dato abierto, no
  se redistribuyen los microdatos originales; el repositorio solo expone la versión agregada/anonimizada.
- La **geocodificación** se hace a nivel de **calle** y los casos se **agregan por comuna/punto**, de modo
  que ningún caso individual es localizable en una vivienda.
- Los **CSV crudos no se versionan** (`.gitignore`); el repositorio solo publica artefactos agregados.

## 4. Sesgos identificados y mitigación

| Sesgo | Origen | Mitigación |
|-------|--------|------------|
| **Subregistro / sesgo de notificación** | Solo se ven casos que llegan al sistema de salud. | Se declara; el modelo pronostica *casos notificados*, no incidencia real. |
| **Sesgo geográfico** | Bucaramanga tiene serie profunda; Floridablanca/Girón no. | Profundidad declarada; Florida se marca como *estimada* y se valida por fracción (−11 % en Bga real). |
| **Desagregación por *share*** | Bucaramanga se reparte por huella espacial, no por conteo real. | Declarado como techo del modelo; no se presenta la comuna como dato medido. |
| **Sesgo de geocodificación** | Direcciones ambiguas → coordenada aproximada. | Agregación por comuna/punto; 80 % de tasa de geocodificación reportada abiertamente. |
| **Deriva temporal** | Un modelo autoregresivo necesita semilla reciente. | Re-anclaje a 2026 con el boletín del INS, con validación cuantitativa. |

## 5. Equidad algorítmica

El modelo **no usa variables sensibles** (sexo, régimen, estrato) como predictores del pronóstico: sus
16 features son estacionalidad, clima y casos recientes por comuna. Las variables demográficas se usan
**solo en el dashboard descriptivo**, para *entender* a la población afectada, no para decidir. Esto evita
que el pronóstico penalice o priorice a un grupo poblacional por su perfil socioeconómico.

## 6. Reproducibilidad y rendición de cuentas

- **Código y datos abiertos** (licencia MIT).
- **Pipelines deterministas** (`random_state=42`) y modelo verificado fiel a ONNX (diff 1e-6).
- Cada métrica del proyecto es **re-derivable** con los scripts publicados; ver [`validacion_guide.md`](validacion_guide.md).
