# 💰 Impacto económico — ¿cuánta plata ahorra esta herramienta?

> Cuánto le cuesta el dengue al sistema de salud, y cuánto puede ahorrar un sistema de
> **alerta temprana** que permita actuar **antes** del pico. Todas las cifras de costo son
> de estudios publicados sobre Colombia; las proporciones de gravedad salen de **nuestros
> propios datos** (SIVIGILA Bucaramanga, 28.626 casos 2015–2025).

---

## 1. El problema en plata: el dengue es caro

A nivel nacional, el dengue le cuesta a Colombia **~USD 159,6 millones al año** (costos directos + indirectos, valuación 2013; Shepard et al.). Otros análisis lo ubican por encima de **$1 billón de pesos anuales** en años epidémicos. Es una de las enfermedades transmitidas por vector más costosas del país.

### Costo directo por caso (sistema de salud, Colombia)

| Tipo de caso | Costo directo (USD) | Fuente |
|---|---|---|
| Ambulatorio | **$120 – $135** | Castañeda-Orjuela (2014); Shepard (2016) |
| Hospitalizado | **$823 – $1.108** | Shepard (2016); Castañeda-Orjuela (2014) |
| Dengue grave | **$1.512 – $1.754** | Castañeda-Orjuela (2014) |

> Para ser conservadores usamos el extremo bajo de cada rango: **$120 / $823 / $1.754**. Como los estudios están en USD de 2013–2014 y no ajustamos por inflación ni por la devaluación del peso, **el costo real hoy es mayor** → nuestras estimaciones quedan por debajo de la realidad.

---

## 2. El perfil de gravedad (de nuestros datos)

De los 28.626 casos de Bucaramanga (SIVIGILA 2015–2025):

| Desenlace | % | Implicación de costo |
|---|---|---|
| Ambulatorio (sin hospitalización) | **68,4 %** | costo bajo |
| Hospitalizado (no grave) | **31,0 %** | costo alto |
| Dengue grave | **0,57 %** | costo muy alto |
| Letalidad | 0,06 % (16 fallecidos) | costo humano irreparable |

**Costo directo promedio ponderado por caso:**

$$ \bar{c} = 0{,}684\cdot 120 + 0{,}310\cdot 823 + 0{,}0057\cdot 1754 \approx \textbf{USD } 347 \;\approx\; \textbf{COP } 1{,}39 \text{ millones} $$

*(TRM conservadora de 4.000 COP/USD.)*

> Es decir: **cada caso de dengue le cuesta al sistema de salud alrededor de $1,4 millones de pesos** solo en atención médica directa (sin contar la productividad perdida del paciente y su cuidador, que los estudios estiman de magnitud similar).

---

## 3. La carga anual en el Área Metropolitana

| Escenario (Bucaramanga) | Casos/año | Carga directa anual |
|---|---|---|
| Año promedio (2015–2025) | 2.602 | **≈ COP 3.600 millones** (USD 0,90 M) |
| **Brote 2024** | **11.541** | **≈ COP 16.000 millones** (USD 4,0 M) |

> Solo Bucaramanga. Sumando Floridablanca y Girón, la carga metropolitana es mayor. En el brote de 2024, Santander fue el **3.er departamento con más casos del país** y reportó **12 fallecidos**.

---

## 4. Cuánto ahorra la herramienta

El valor económico de un **sistema de alerta temprana** no es "curar más barato", sino **evitar casos**: anticipar el pico por comuna permite focalizar fumigación, eliminación de criaderos y campañas **antes** de que la transmisión se dispare. Cada caso evitado es un costo de atención que no se incurre.

La **palanca clave es el % de reducción de casos** que logre la respuesta. Lo presentamos como escenarios (no como promesa), aplicados al año de brote (donde la prevención más rinde):

| Reducción de casos | Ahorro anual (brote, Bga) |
|---|---|
| **10 %** (conservador) | **≈ COP 1.600 millones/año** (USD 0,40 M) |
| **20 %** (moderado) | **≈ COP 3.200 millones/año** (USD 0,80 M) |
| **30 %** (optimista) | **≈ COP 4.800 millones/año** (USD 1,20 M) |

Incluso en un **año promedio**, una reducción del 20 % ahorra **~COP 720 millones/año** solo en Bucaramanga.

---

## 5. El retorno de inversión (ROI): casi infinito

| Concepto | Costo |
|---|---|
| Infraestructura (hosting) | **$0** — sitio estático en Vercel, sin servidor |
| Inferencia del modelo | **$0** — corre en el navegador del usuario |
| Licencias | **$0** — código abierto, modelo ONNX libre |
| Mantenimiento | reentrenar el modelo (horas de cómputo, esporádico) |

> La herramienta cuesta **prácticamente cero** operar. Frente a un ahorro potencial de **cientos a miles de millones de pesos al año**, el ROI es desproporcionadamente alto: **un solo caso de dengue evitado (~$1,4 M COP) ya paga con creces todo el proyecto.** Evitar un puñado de hospitalizaciones graves equivale al costo anual de operar el sistema muchas veces.

---

## 6. Más allá del costo directo (el ahorro real es mayor)

Nuestras cifras son **deliberadamente conservadoras**. El ahorro verdadero incluye además:
- **Costos indirectos:** días laborales/escolares perdidos del paciente y del cuidador (los estudios los estiman ≈ igual o mayores que los directos → el costo total por caso casi se **duplica**).
- **Costos de respuesta no focalizada:** fumigar a ciegas toda la ciudad cuesta más que actuar quirúrgicamente sobre las comunas que el modelo señala en riesgo.
- **Costo humano:** muertes evitadas (letalidad 0,06 %), que no tienen precio de mercado.

---

## 7. Supuestos y límites (honestidad metodológica)

- Costos por caso de estudios 2013–2014 en USD, a TRM 4.000 sin ajuste por inflación → **subestiman** el costo actual.
- El **% de reducción de casos** es el supuesto más sensible y **depende de la capacidad de respuesta** de la autoridad sanitaria: la herramienta *habilita* el ahorro, no lo garantiza por sí sola.
- La proporción ambulatorio/hospitalizado/grave es de Bucaramanga; puede variar por municipio y por temporada.
- El ahorro se calcula sobre Bucaramanga; el AMB completo (con Floridablanca y Girón) implica cifras mayores.

---

## 8. Mensaje para el jurado (una frase)

> El dengue le cuesta a Bucaramanga **hasta ~$16.000 millones de pesos en un año de brote**. Una herramienta de alerta temprana **de costo operativo casi nulo** que ayude a evitar apenas el **10–30 %** de los casos representa un ahorro de **$1.600 a $4.800 millones anuales** — además de hospitalizaciones y vidas. El retorno no es marginal: es de **órdenes de magnitud**.

---

## Fuentes

- [Cost of dengue in Colombia: A systematic review (PMC, 2024)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11670977/)
- [Costs of Dengue to the Health System and Individuals in Colombia 2010–2012 (PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4385762/) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/25667054/)
- [Dengue cuesta más de $1 billón al año en Colombia, según estudio de PLOS (Portafolio)](https://www.portafolio.co/economia/finanzas/dengue-cuesta-mas-de-1-billon-al-ano-en-colombia-segun-estudio-de-plos-629391)
- [Estudio: costos anuales del dengue en Colombia llegan a $654.000 millones (El Colombiano)](https://www.elcolombiano.com/colombia/salud/dengue-estudio-muestra-costos-anuales-de-enfrentar-el-virus-en-colombia-JH27319145)
- [Brote de dengue en Santander: 5.008 casos (Gobernación de Santander)](https://santander.gov.co/publicaciones/9534/brote-de-dengue-en-santander-continua-en-aumento-ya-son-5008-casos/)
- [Siete datos alarmantes sobre el dengue en Santander (Vanguardia, 2024)](https://www.vanguardia.com/area-metropolitana/bucaramanga/2024/07/01/siete-datos-alarmantes-sobre-el-dengue-en-santander/)
- Proporciones de gravedad: cálculo propio sobre SIVIGILA Bucaramanga 2015–2025 (`public/data/dengue.json`).
