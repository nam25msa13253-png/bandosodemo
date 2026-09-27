"use client";
import { useState } from "react";
import { Loader2, LocateFixed, X } from "lucide-react";

/** Nút "Gần tôi": lấy vị trí rồi điền vào form GET */
export function NearMeFields({ lat, lng, radius }: { lat?: number | null; lng?: number | null; radius?: number | null }) {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(lat != null && lng != null ? { lat, lng } : null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const locate = () => {
    if (!navigator.geolocation) return setMsg("Trình duyệt không hỗ trợ định vị");
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6) });
        setBusy(false);
        setMsg(null);
      },
      () => {
        setBusy(false);
        setMsg("Chưa cho phép định vị");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div>
      <p className="label">Khoảng cách</p>
      {pos ? (
        <>
          <input type="hidden" name="lat" value={pos.lat} />
          <input type="hidden" name="lng" value={pos.lng} />
          <div className="flex gap-2">
            <select name="radius" defaultValue={radius ?? ""} className="input">
              <option value="">Mọi khoảng cách</option>
              <option value="1">Trong 1 km</option>
              <option value="2">Trong 2 km</option>
              <option value="5">Trong 5 km</option>
              <option value="10">Trong 10 km</option>
            </select>
            <button type="button" onClick={() => setPos(null)} className="btn btn-outline px-2" title="Bỏ vị trí">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-emerald-700">Đã lấy vị trí của bạn</p>
        </>
      ) : (
        <button type="button" onClick={locate} className="btn btn-outline w-full">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />} Dùng vị trí của tôi
        </button>
      )}
      {msg && <p className="mt-1 text-xs text-amber-700">{msg}</p>}
    </div>
  );
}
