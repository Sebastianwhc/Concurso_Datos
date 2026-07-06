# Conclusiones, Limitaciones y Próximos Pasos

## 1. Hallazgos principales

1. **La inercia epidémica predice; el clima modula.** El clima por sí solo **no** predice el dengue
   (R² = −0,49 en validación temporal). La señal predictiva vive en los **casos recientes** (variables
   autoregresivas). El clima aporta como **modulador**, igual que en los sistemas de alerta reales.
2. **El modelo generaliza al brote.** Con partición temporal honesta (train ≤ 2023, test 2024–2025, el
   año epidémico), el `GradientBoostingRegressor` logra **R² = 0,571 · MAE = 2,99**, muy por encima del
   baseline (R² = −0,36). En el **backtest ciego del brote 2024** (arranca en 2024-S8) reproduce la
   trayectoria ascendente, subestimando el pico ~17 % (conservador, pero acierta dirección y magnitud).
3. **El techo está en el dato, no en el algoritmo.** La ablación mostró que la pérdida de Poisson
   *empeora* (R² = 0,49) y el contagio espacial (`vecinos_l1`) aporta ruido (+0,003). La mejora real
   vendría de **conteos por comuna medidos**, no de un modelo más complejo. Ver [`INFORME_MATEMATICO.md`](INFORME_MATEMATICO.md) §4.6.
4. **El re-anclaje a 2026 es verificable.** La fracción `f_Bga = 0,304` (calibrada en 2024–2025) predice
   el Bucaramanga real de 2026 con **−11,2 %** de error, lo que valida el método antes de aplicarlo a
   Floridablanca (`f_Florida = 0,119`).
5. **La IA en el navegador funciona.** El modelo (ONNX, ~372 KB) corre 100 % en cliente con
   `onnxruntime-web`; la demo no depende de servidor ni de WiFi.

## 2. Contribución

- Un **pipeline reproducible** de datos abiertos → artefactos compactos → modelo → despliegue estático.
- Un **simulador interactivo** que cierra el ciclo **predicción → acción (recomendaciones) → impacto (COP)**.
- Un enfoque **honesto y auditable**: cada afirmación tiene su métrica y su frontera de incertidumbre declarada.

## 3. Limitaciones (declaradas)

- **Profundidad temporal asimétrica:** Bucaramanga 2015–2025; Floridablanca/Girón solo 2023–2025. Las
  predicciones de Florida se apoyan más en clima + estacionalidad y son la pata más débil.
- **Bucaramanga desagregada por *share* espacial**, no por conteo real por comuna: introduce un techo en
  la resolución del modelo.
- **Girón** no publica comunas en datos abiertos → se representa como burbujas, no como coropleto.
- **Geocodificación a nivel de calle** (no de vivienda): casos de una misma calle comparten coordenada.
- **Clima CDMB** solo cubre 2025; el histórico largo se apoya en IDEAM.
- **Modo "tiempo real"** usa Open-Meteo (abierto, pero no datos.gov.co); el histórico de entrenamiento sí
  usa fuentes oficiales IDEAM/CDMB.

## 4. Próximos pasos

- **Conteos reales por comuna** (convenio con la Secretaría de Salud) → el mayor salto de precisión posible.
- **Piloto operativo** con una autoridad sanitaria para medir el impacto real de la alerta temprana.
- **Extender el AMB** a Girón y Piedecuesta cuando haya geografía abierta.
- **Optimizar el bundle** (ECharts ~1,5 MB) con carga diferida.
- **Requisito de elegibilidad:** publicar el "Uso" en `datos.gov.co/usos` e inscribir dentro del cronograma.
