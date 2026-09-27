"use client";
import { useEffect, useState } from "react";
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSun, Droplets, Sun, Wind } from "lucide-react";

// Mã thời tiết WMO -> mô tả tiếng Việt
function describe(code: number) {
  if (code === 0) return { text: "Trời quang", Icon: Sun };
  if (code <= 2) return { text: "Ít mây", Icon: CloudSun };
  if (code === 3) return { text: "Nhiều mây", Icon: Cloud };
  if (code <= 48) return { text: "Sương mù", Icon: CloudFog };
  if (code <= 57) return { text: "Mưa phùn", Icon: CloudDrizzle };
  if (code <= 67 || (code >= 80 && code <= 82)) return { text: "Có mưa", Icon: CloudRain };
  if (code >= 95) return { text: "Dông", Icon: CloudLightning };
  return { text: "Có mây", Icon: Cloud };
}

type W = { t: number; code: number; hum: number; wind: number; max: number; min: number };

export function WeatherWidget({ lat, lng, place }: { lat: number; lng: number; place: string }) {
  const [w, setW] = useState<W | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FBangkok&forecast_days=1`;
    fetch(url)
      .then((r) => r.json())
      .then((d) =>
        setW({
          t: d.current.temperature_2m,
          code: d.current.weather_code,
          hum: d.current.relative_humidity_2m,
          wind: d.current.wind_speed_10m,
          max: d.daily.temperature_2m_max[0],
          min: d.daily.temperature_2m_min[0],
        }),
      )
      .catch(() => setErr(true));
  }, [lat, lng]);

  if (err) return null;
  const d = w ? describe(w.code) : null;
  return (
    <div className="card overflow-hidden bg-gradient-to-br from-sky-500 to-navy-700 p-4 text-white">
      <p className="text-xs font-medium uppercase tracking-wider text-white/75">Thời tiết {place}</p>
      {w && d ? (
        <>
          <div className="mt-2 flex items-center gap-3">
            <d.Icon className="h-11 w-11 text-accent" />
            <div>
              <p className="text-3xl font-extrabold leading-none">{Math.round(w.t)}°C</p>
              <p className="text-sm text-white/85">{d.text} · {Math.round(w.min)}°–{Math.round(w.max)}°</p>
            </div>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-white/85">
            <span className="inline-flex items-center gap-1"><Droplets className="h-3.5 w-3.5" /> Độ ẩm {w.hum}%</span>
            <span className="inline-flex items-center gap-1"><Wind className="h-3.5 w-3.5" /> Gió {Math.round(w.wind)} km/h</span>
          </div>
        </>
      ) : (
        <div className="mt-3 h-12 animate-pulse rounded-lg bg-white/20" />
      )}
    </div>
  );
}
