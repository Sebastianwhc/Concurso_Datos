/**
 * Clima en tiempo real de Bucaramanga vía Open-Meteo (API abierta, sin key, CORS).
 *
 * El modelo usa features SEMANALES (precip = suma semanal; temp/humedad = media),
 * así que no usamos el dato instantáneo suelto: agregamos las últimas ~168 horas
 * (7 días) para construir un escenario coherente con cómo se entrenó el modelo.
 * El histórico de entrenamiento usa IDEAM/CDMB (oficiales); este modo solo alimenta
 * el escenario en vivo.
 */
const BGA = { lat: 7.12, lon: -73.12 };

export interface LiveClima {
  precip: number; // mm acumulados últimos 7 días (≈ precipitación semanal)
  temp: number; // °C, media 7 días
  humedad: number; // % HR, media 7 días
  currentTemp: number; // lectura instantánea
  currentPrecip: number; // lectura instantánea
  updated: number; // epoch ms del fetch
}

export async function fetchLiveClima(): Promise<LiveClima> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${BGA.lat}&longitude=${BGA.lon}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation` +
    `&hourly=temperature_2m,relative_humidity_2m,precipitation` +
    `&past_days=7&forecast_days=1&timezone=America/Bogota`;

  const r = await fetch(url);
  if (!r.ok) throw new Error(`Open-Meteo respondió ${r.status}`);
  const d = await r.json();
  const h = d.hourly ?? {};
  const times: string[] = h.time ?? [];
  const n = times.length;
  const lo = Math.max(0, n - 168); // últimas 168 horas = 7 días

  let psum = 0;
  let tsum = 0;
  let hsum = 0;
  let cnt = 0;
  for (let i = lo; i < n; i++) {
    const p = h.precipitation?.[i];
    const t = h.temperature_2m?.[i];
    const hu = h.relative_humidity_2m?.[i];
    if (typeof p === 'number') psum += p;
    if (typeof t === 'number' && typeof hu === 'number') {
      tsum += t;
      hsum += hu;
      cnt++;
    }
  }

  const cur = d.current ?? {};
  return {
    precip: Math.round(psum * 10) / 10,
    temp: cnt ? Math.round((tsum / cnt) * 10) / 10 : cur.temperature_2m,
    humedad: cnt ? Math.round(hsum / cnt) : cur.relative_humidity_2m,
    currentTemp: cur.temperature_2m,
    currentPrecip: cur.precipitation ?? 0,
    updated: Date.now(),
  };
}
