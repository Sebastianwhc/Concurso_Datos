# 🧾 Brief para Daniela — Acto económico en el storyscrolling

> **Objetivo:** convertir el impacto económico en un momento de scroll fuerte en la landing.
> En salud pública, **la plata es casi todo**: un secretario de salud actúa cuando ve que el
> dengue le drena el presupuesto y que puede evitarlo casi gratis. Esa es la palanca de enganche.
>
> Todas las cifras de abajo ya están validadas y con fuente en
> [`06_IMPACTO_ECONOMICO.md`](06_IMPACTO_ECONOMICO.md). **No inventar números nuevos.**

---

## 1. Idea central (el arco que persuade)

El dinero debe golpear **dos veces**:

1. **Como amenaza (stakes)** → dentro de `ThreatSection`: el dengue no solo enferma, *sangra* presupuesto.
2. **Como recompensa (payoff)** → sección nueva **después del Simulador, antes del CTA**: cuánto cuesta vs. cuánto ahorra.

Ese paréntesis (*costo enorme → herramienta casi gratis → ahorro enorme*) es lo que engancha.

---

## 2. Dónde va en el scroll

Orden actual:

```
Hero → Threat → Transition → Territory → Solution → Simulator → [👉 NUEVO: Retorno] → CTA
```

- **Beat 1** se suma dentro de `ThreatSection` (no es sección nueva).
- **Beat 2** es una **sección nueva** `ReturnSection.tsx` (o el nombre que prefieras), montada en `LandingView.tsx` entre `<SimulatorSection />` y `<CTASection />`.

---

## 3. Beat 1 — dentro de ThreatSection (los stakes)

Una sola frase con **contador animado** al entrar en viewport. Reencuadra la amenaza de clínica a financiera:

> **El dengue no solo enferma.**
> En el brote de 2024 le costó a Bucaramanga **≈ $16.000 millones de pesos.**

- Cifra: **$16.000 millones** (carga directa del brote 2024, Bga). Fuente: doc económico §3.
- Animar el contador de 0 → 16.000 al hacer scroll-in, igual que los demás números de la landing.

---

## 4. Beat 2 — `ReturnSection` (el payoff, el enganche fuerte)

Cuatro sub-momentos en scroll, en este orden exacto. Cada uno es un contador o tarjeta que aparece al entrar en viewport:

| # | Mensaje | Cifra (animar) | Fuente |
|---|---|---|---|
| 1 | **Cada caso de dengue cuesta** | **≈ $1,4 millones** | doc §2 (ponderado 68% ambulatorio / 31% hosp / 0,57% grave — *datos propios SIVIGILA*) |
| 2 | **Operar esta herramienta cuesta** | **≈ $0** | doc §5 (estático en Vercel, IA en el navegador, código abierto) |
| 3 | **Evitar el 10–30% de los casos ahorra** | **$1.600 – $4.800 millones / año** | doc §4 (escenarios sobre brote Bga) |
| 4 | **Frase de cierre (la más fuerte):** | — | doc §5 |

**Copy del cierre (Beat 2.4), grande, a pantalla:**

> **Un solo caso de dengue evitado paga todo el proyecto.**
> El retorno no es marginal: es de **órdenes de magnitud.**

→ Esto desemboca naturalmente en el CTA.

---

## 5. Nota de honestidad (mantenerla — suma en la rúbrica)

Incluir una línea pequeña, sobria, debajo del bloque de ahorro:

> *La herramienta **habilita** el ahorro; el % de casos evitados depende de la capacidad de
> respuesta de la autoridad sanitaria. Cifras conservadoras (costos 2013–2014, sin ajuste por inflación).*

El jurado premia el rigor. No vender el ahorro como promesa garantizada.

---

## 6. Notas técnicas para el build

- **Estilo:** reusar el mismo lenguaje visual de las demás secciones (contadores animados on-scroll, glass, paleta existente). Que se sienta parte del mismo storyscrolling, no un dashboard.
- **Datos dinámicos vs. constantes:**
  - El **$1,4 M por caso**, el **$0** y los **escenarios de ahorro** son constantes derivadas del doc → pueden ir como constantes en el componente.
  - Si quieres que el **$16.000 M** y el conteo de casos reaccionen a datos reales, ya tienes el objeto `stats` que `LandingView` calcula y pasa a `ThreatSection` (`stats.bga2025`, etc.). Reutilízalo en vez de recalcular.
- **Accesibilidad:** los contadores deben terminar en su valor final aunque el usuario tenga `prefers-reduced-motion` (sin animación, número fijo).
- **Móvil:** las 4 cifras del Beat 2 en columna apilada; nada de tablas anchas.

---

## 7. Cómo verlo en una frase (para alinear al equipo)

> El dengue le cuesta a Bucaramanga **hasta ~$16.000 millones en un año de brote**.
> Una herramienta de **costo operativo casi nulo** que evite apenas **10–30%** de casos ahorra
> **$1.600–$4.800 millones al año** — además de hospitalizaciones y vidas.
