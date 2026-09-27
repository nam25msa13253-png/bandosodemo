"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as MLMap, GeoJSONSource, MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type MapPoint = {
  id: string;
  slug: string;
  name: string;
  sectorName: string;
  color: string;
  lat: number;
  lng: number;
  phone?: string | null;
  image?: string | null;
};

const GOONG_KEY = process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY;
/** Nền bản đồ: Goong (nếu có khóa) hoặc OpenFreeMap (miễn phí, không cần khóa) */
export const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ||
  (GOONG_KEY
    ? `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_KEY}`
    : "https://tiles.openfreemap.org/styles/liberty");

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

type Props = {
  points: MapPoint[];
  center: [number, number]; // [lat, lng]
  zoom?: number;
  userLocation?: { lat: number; lng: number } | null;
  className?: string;
  /** tự căn khung nhìn theo các điểm khi danh sách thay đổi */
  fitToPoints?: boolean;
  /** chế độ chọn vị trí (form): bấm lên bản đồ để đặt điểm */
  pickMode?: boolean;
  picked?: { lat: number; lng: number } | null;
  onPick?: (p: { lat: number; lng: number }) => void;
  focusId?: string | null;
};

export default function MapView({
  points, center, zoom = 14, userLocation, className = "h-[420px]", fitToPoints, pickMode, picked, onPick, focusId,
}: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const libRef = useRef<typeof import("maplibre-gl") | null>(null);
  const markerRef = useRef<import("maplibre-gl").Marker | null>(null);
  const userMarkerRef = useRef<import("maplibre-gl").Marker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Khởi tạo bản đồ 1 lần
  useEffect(() => {
    let disposed = false;
    (async () => {
      const ml = await import("maplibre-gl");
      if (disposed || !el.current) return;
      libRef.current = ml;
      const map = new ml.Map({
        container: el.current,
        style: MAP_STYLE,
        center: [center[1], center[0]],
        zoom,
        attributionControl: { compact: true },
      });
      mapRef.current = map;
      map.addControl(new ml.NavigationControl({ visualizePitch: false }), "top-right");
      map.addControl(
        new ml.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }),
        "top-right",
      );
      map.on("error", (e) => {
        // lỗi tải nền bản đồ -> vẫn hiện danh sách, báo nhẹ
        if (String(e?.error?.message || "").match(/style|Failed to fetch/i)) setFailed(true);
      });
      map.on("load", () => {
        map.addSource("places", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
          cluster: !pickMode,
          clusterRadius: 40,
          clusterMaxZoom: 15,
        });
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "places",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#0f3460",
            "circle-opacity": 0.88,
            "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 50, 26],
            "circle-stroke-width": 3,
            "circle-stroke-color": "#fbbf24",
          },
        });
        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "places",
          filter: ["has", "point_count"],
          layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12, "text-font": GOONG_KEY ? ["Roboto Medium"] : ["Noto Sans Bold"] },
          paint: { "text-color": "#ffffff" },
        });
        map.addLayer({
          id: "points",
          type: "circle",
          source: "places",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": ["get", "color"],
            "circle-radius": ["case", ["==", ["get", "focus"], 1], 11, 7.5],
            "circle-stroke-width": 2.5,
            "circle-stroke-color": "#ffffff",
          },
        });

        map.on("click", "clusters", async (e: MapMouseEvent & { features?: GeoJSON.Feature[] }) => {
          const f = e.features?.[0];
          if (!f) return;
          const src = map.getSource("places") as GeoJSONSource;
          const z = await src.getClusterExpansionZoom((f.properties as { cluster_id: number }).cluster_id);
          map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom: z });
        });
        map.on("click", "points", (e: MapMouseEvent & { features?: GeoJSON.Feature[] }) => {
          if (pickMode) return;
          const f = e.features?.[0];
          if (!f) return;
          const p = f.properties as Record<string, string>;
          const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
          // Dựng nội dung popup bằng DOM (dữ liệu đã được esc) thay vì setHTML của thư viện
          const box = document.createElement("div");
          box.innerHTML = `<div style="min-width:200px">
                ${p.image ? `<img src="${esc(p.image)}" style="width:100%;height:110px;object-fit:cover;border-radius:10px;margin-bottom:8px" alt=""/>` : ""}
                <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:${esc(p.color)}">${esc(p.sectorName)}</div>
                <div style="font-weight:700;color:#1e293b;margin:2px 0 8px;line-height:1.3">${esc(p.name)}</div>
                <div style="display:flex;gap:6px">
                  <a href="/dich-vu/${esc(p.slug)}" style="flex:1;text-align:center;background:#0f3460;color:#fff;border-radius:8px;padding:6px 0;font-size:13px;font-weight:600">Chi tiết</a>
                  ${p.phone ? `<a href="tel:${esc(p.phone)}" style="flex:1;text-align:center;background:#059669;color:#fff;border-radius:8px;padding:6px 0;font-size:13px;font-weight:600">Gọi</a>` : ""}
                  <a href="https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}" target="_blank" rel="noreferrer" style="flex:1;text-align:center;background:#fbbf24;color:#0f172a;border-radius:8px;padding:6px 0;font-size:13px;font-weight:600">Chỉ đường</a>
                </div>
              </div>`;
          new ml.Popup({ offset: 12, maxWidth: "280px" }).setLngLat(coords).setDOMContent(box).addTo(map);
        });
        for (const layer of ["clusters", "points"]) {
          map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
          map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = pickMode ? "crosshair" : ""));
        }
        if (pickMode) {
          map.getCanvas().style.cursor = "crosshair";
          map.on("click", (e) => onPickRef.current?.({ lat: +e.lngLat.lat.toFixed(6), lng: +e.lngLat.lng.toFixed(6) }));
        }
        setReady(true);
      });
    })();
    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cập nhật điểm
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const src = map.getSource("places") as GeoJSONSource | undefined;
    src?.setData({
      type: "FeatureCollection",
      features: points.map((p) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
        properties: {
          id: p.id, slug: p.slug, name: p.name, sectorName: p.sectorName, color: p.color,
          phone: p.phone ?? "", image: p.image ?? "", focus: p.id === focusId ? 1 : 0,
        },
      })),
    });
    if (fitToPoints && points.length) {
      const lib = libRef.current!;
      const b = new lib.LngLatBounds();
      points.forEach((p) => b.extend([p.lng, p.lat]));
      if (userLocation) b.extend([userLocation.lng, userLocation.lat]);
      map.fitBounds(b, { padding: 50, maxZoom: 16, duration: 600 });
    }
  }, [points, ready, fitToPoints, focusId, userLocation]);

  // Vị trí người dùng
  useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (!ready || !map || !lib) return;
    userMarkerRef.current?.remove();
    if (userLocation) {
      const dot = document.createElement("div");
      dot.style.cssText =
        "width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 6px rgba(37,99,235,.25)";
      userMarkerRef.current = new lib.Marker({ element: dot }).setLngLat([userLocation.lng, userLocation.lat]).addTo(map);
    }
  }, [userLocation, ready]);

  // Điểm được chọn trong form
  useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (!ready || !map || !lib) return;
    markerRef.current?.remove();
    if (picked) {
      markerRef.current = new lib.Marker({ color: "#e11d48" }).setLngLat([picked.lng, picked.lat]).addTo(map);
    }
  }, [picked, ready]);

  // Bay tới điểm được chọn trong danh sách
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !focusId) return;
    const p = points.find((x) => x.id === focusId);
    if (p) map.flyTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 16) });
  }, [focusId, ready, points]);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ${className}`}>
      <div className="absolute inset-0">
        <div ref={el} className="h-full w-full" />
      </div>
      {failed && (
        <div className="absolute inset-x-3 top-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 shadow">
          Tạm thời không tải được nền bản đồ. Danh sách vẫn sử dụng bình thường.
        </div>
      )}
    </div>
  );
}
