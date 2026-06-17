/**
 * Motor de pronóstico del simulador (corre 100% en el navegador, ONNX).
 *
 * Reproduce fielmente el feature-engineering de `ml/train_model.py`:
 *   feature_order = [semana, sin52, cos52, incidencia_base, log_pob, es_floridablanca,
 *                    precip, temp, humedad, precip_acum8, temp_mean8, humedad_mean8,
 *                    casos_l1, casos_l2, casos_l3, casos_ma4]
 *   target = log1p(casos)  ->  el frontend aplica expm1.
 *
 * Pronóstico AUTOREGRESIVO: la predicción de la semana t se realimenta como
 * casos_l1 de t+1, así se proyecta semana a semana. El clima (sliders) entra
 * como escenario SOSTENIDO sobre el horizonte:
 *   precip_acum8 = precip·8 · temp_mean8 = temp · humedad_mean8 = humedad
 */
// Subpath /wasm = backend CPU puro: solo requiere ort-wasm-simd-threaded.wasm
// (evita el wasm jsep de WebGPU, ~21 MB) y corre offline sin headers COOP/COEP.
import * as ort from 'onnxruntime-web/wasm';
// El binario .wasm y su glue .mjs viven en src/ y se resuelven con ?url para que
// Vite los emita como assets (funciona en dev y en build). No se pueden importar
// desde node_modules/onnxruntime-web/dist (el campo "exports" lo bloquea) ni desde
// /public (Vite dev rechaza importar .mjs dinámicamente desde /public).
import wasmUrl from './ortwasm/ort-wasm-simd-threaded.wasm?url';
import mjsUrl from './ortwasm/ort-wasm-simd-threaded.mjs?url';

export interface Comuna {
  id: string;
  municipio: string;
  nombre: string;
  pob: number;
  incidencia_base: number;
  share: number;
}

export interface ClimaRange {
  min: number;
  max: number;
  med: number;
}

export interface ModelMeta {
  feature_order: string[];
  target_transform: string;
  static_features: string[];
  clima_features: string[];
  ar_features: string[];
  medians: Record<string, number>;
  clima_ranges: { precip: ClimaRange; temp: ClimaRange; humedad: ClimaRange };
  comunas: Comuna[];
  seed: Record<string, number[]>;
  last_week: Record<string, { anio: number; semana: number }>;
  metrics: {
    baseline: { set: string; MAE: number; RMSE: number; R2: number };
    modelo: { set: string; MAE: number; RMSE: number; R2: number };
  };
  nota: string;
}

export interface ClimaEscenario {
  precip: number;
  temp: number;
  humedad: number;
}

/** Resultado: una trayectoria de casos predichos por comuna, semana a semana. */
export interface ForecastResult {
  /** id de comuna -> casos predichos por semana proyectada (longitud = horizonte). */
  porComuna: Record<string, number[]>;
  /** total metropolitano por semana proyectada. */
  totalSemana: number[];
  horizonte: number;
}

const FEATURE_COUNT = 16;

let sessionPromise: Promise<ort.InferenceSession> | null = null;

/** Carga (una sola vez) la sesión ONNX. wasm servido localmente desde /ort para demo offline. */
export function getSession(baseUrl: string): Promise<ort.InferenceSession> {
  if (!sessionPromise) {
    // Single-thread: evita requerir headers COOP/COEP en el hosting estático.
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.wasmPaths = { wasm: wasmUrl, mjs: mjsUrl };
    sessionPromise = ort.InferenceSession.create(`${baseUrl}data/model.onnx`);
  }
  return sessionPromise;
}

/** ISO-week resultante de avanzar `k` semanas desde `desde` (envuelve en 52). */
function semanaProyectada(desde: number, k: number): number {
  return ((desde + k - 1) % 52) + 1;
}

/** log1p(pob) redondeado a 3 decimales, igual que el pipeline Python. */
function logPob(pob: number): number {
  return Math.round(Math.log1p(pob) * 1000) / 1000;
}

/**
 * Corre el pronóstico recursivo para TODAS las comunas sobre `horizonte` semanas,
 * bajo el escenario climático dado. Una inferencia ONNX por semana (batch de comunas).
 */
export async function correrPronostico(
  session: ort.InferenceSession,
  meta: ModelMeta,
  clima: ClimaEscenario,
  horizonte: number
): Promise<ForecastResult> {
  const comunas = meta.comunas;
  const n = comunas.length;

  // Estado autoregresivo por comuna: historial de casos (arranca con la semilla).
  const hist: Record<string, number[]> = {};
  for (const c of comunas) hist[c.id] = [...(meta.seed[c.id] ?? [0, 0, 0, 0])];

  const porComuna: Record<string, number[]> = {};
  for (const c of comunas) porComuna[c.id] = [];
  const totalSemana: number[] = [];

  // Clima sostenido sobre el horizonte (escenario de los sliders).
  const precip = clima.precip;
  const temp = clima.temp;
  const humedad = clima.humedad;
  const precipAcum8 = precip * 8;

  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];

  for (let k = 1; k <= horizonte; k++) {
    const flat = new Float32Array(n * FEATURE_COUNT);

    for (let i = 0; i < n; i++) {
      const c = comunas[i];
      const h = hist[c.id];
      const m = h.length;
      const l1 = h[m - 1];
      const l2 = h[m - 2];
      const l3 = h[m - 3];
      const ma4 = (h[m - 1] + h[m - 2] + h[m - 3] + h[m - 4]) / 4;

      const sem = semanaProyectada(meta.last_week[c.id]?.semana ?? 25, k);
      const ang = (2 * Math.PI * sem) / 52;

      const o = i * FEATURE_COUNT;
      flat[o + 0] = sem;
      flat[o + 1] = Math.sin(ang);
      flat[o + 2] = Math.cos(ang);
      flat[o + 3] = c.incidencia_base;
      flat[o + 4] = logPob(c.pob);
      flat[o + 5] = c.municipio === 'Floridablanca' ? 1 : 0;
      flat[o + 6] = precip;
      flat[o + 7] = temp;
      flat[o + 8] = humedad;
      flat[o + 9] = precipAcum8;
      flat[o + 10] = temp;
      flat[o + 11] = humedad;
      flat[o + 12] = l1;
      flat[o + 13] = l2;
      flat[o + 14] = l3;
      flat[o + 15] = ma4;
    }

    const tensor = new ort.Tensor('float32', flat, [n, FEATURE_COUNT]);
    const out = await session.run({ [inputName]: tensor });
    const logPred = out[outputName].data as Float32Array | Float64Array;

    let total = 0;
    for (let i = 0; i < n; i++) {
      const casos = Math.max(0, Math.expm1(Number(logPred[i])));
      porComuna[comunas[i].id].push(casos);
      hist[comunas[i].id].push(casos); // realimentación AR
      total += casos;
    }
    totalSemana.push(total);
  }

  return { porComuna, totalSemana, horizonte };
}
