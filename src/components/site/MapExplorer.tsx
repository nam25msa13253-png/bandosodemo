"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Clock, Loader2, LocateFixed, RotateCcw, ChevronRight, List, Map as MapIcon } from "lucide-react";
import { LazyMap } from "../map/LazyMap";
import type { MapPoint } from "../map/MapView";
import { SectorIcon } from "../SectorIcon";
import { PlaceCard } from "./PlaceCard";
import type { PlaceListItem } from "@/lib/queries";

type SectorOpt = { id: string; name: string; icon: string; color: string; count: number };

const RADII = [0, 1, 2, 5, 10];

export function MapExplorer({ sectors, center, zoom }: { sectors: SectorOpt[]; center: [number, number]; zoom: number }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [verified, setVerified] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [radius, setRadius] = useState(0);
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locMsg, setLocMsg] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [items, setItems] = useState<PlaceListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [focus, setFocus] = useState<string | null>(null);
  const [showAllSectors, setShowAllSectors] = useState(false);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");

  const params = useMemo(() => {
    const sp = new URLSearchParams();
    selected.forEach((s) => sp.append("sector", s));
    if (verified) sp.set("verified", "1");
    if (openNow) sp.set("open", "1");
    if (loc) {
      sp.set("lat", String(loc.lat));
      sp.set("lng", String(loc.lng));
      if (radius) sp.set("radius", String(radius));
    }
    return sp;
  }, [selected, verified, openNow, loc, radius]);

  useEffect(() => {
    setLoading(true);
    const ctl = new AbortController();
    const sp = new URLSearchParams(params);
    sp.set("pageSize", "1000");
    sp.set("sort", loc ? "distance" : "relevance");
    fetch(`/api/places?${sp}`, { signal: ctl.signal })
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items);
        setTotal(d.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [params, loc]);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setLocMsg("Trình duyệt không hỗ trợ định vị.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocMsg(null);
        setLocating(false);
        if (!radius) setRadius(2);
      },
      () => {
        setLocMsg("Bạn chưa cho phép định vị nên không lọc được theo khoảng cách.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [radius]);

  const reset = () => {
    setSelected([]);
    setVerified(false);
    setOpenNow(false);
    setRadius(0);
    setLoc(null);
  };

  const points: MapPoint[] = useMemo(
    () =>
      items
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => ({
          id: p.id, slug: p.slug, name: p.name, sectorName: p.sectorName, color: p.sectorColor,
          lat: p.lat!, lng: p.lng!, phone: p.phones[0], image: p.image,
        })),
    [items],
  );

  const toggleSector = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  // Điện thoại: hiện tất cả dạng cuộn ngang; máy tính: thu gọn 8 mục đầu
  const visibleSectors = sectors.map((s, i) => ({ ...s, hideDesktop: !showAllSectors && i >= 8 }));
  const allCount = sectors.reduce((a, b) => a + b.count, 0);

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6">
      {/* Bộ lọc lĩnh vực */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Lĩnh vực</h2>
          <button onClick={reset} className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-navy-700">
            <RotateCcw className="h-4 w-4" /> Đặt lại bộ lọc
          </button>
        </div>
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
          <button
            onClick={() => setSelected([])}
            className={`chip shrink-0 whitespace-nowrap ${selected.length === 0 ? "border-navy-800 bg-navy-800 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
          >
            Tất cả <span className="opacity-70">{allCount}</span>
          </button>
          {visibleSectors.map((s) => {
            const on = selected.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggleSector(s.id)}
                disabled={s.count === 0}
                className={`chip shrink-0 whitespace-nowrap disabled:opacity-40 ${s.hideDesktop ? "md:hidden" : ""} ${on ? "text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
                style={on ? { background: s.color, borderColor: s.color } : undefined}
              >
                <SectorIcon name={s.icon} className="h-4 w-4" style={on ? undefined : { color: s.color }} />
                {s.name} <span className="opacity-70">{s.count}</span>
              </button>
            );
          })}
          {sectors.length > 8 && (
            <button onClick={() => setShowAllSectors((v) => !v)} className="chip hidden shrink-0 border-dashed border-slate-300 text-slate-600 md:inline-flex">
              {showAllSectors ? "Thu gọn" : `Xem thêm ${sectors.length - 8}`}
            </button>
          )}
        </div>

        {/* Bộ lọc nhanh */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <span className="mr-1 text-sm font-semibold text-slate-600">Lọc nhanh:</span>
          <button
            onClick={() => (loc ? setLoc(null) : locate())}
            className={`chip ${loc ? "border-sky-600 bg-sky-600 text-white" : "border-slate-200 bg-white text-slate-700"}`}
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />} Gần tôi
          </button>
          <button
            onClick={() => setVerified((v) => !v)}
            className={`chip ${verified ? "border-sky-600 bg-sky-600 text-white" : "border-slate-200 bg-white text-slate-700"}`}
          >
            <BadgeCheck className="h-4 w-4" /> Đã xác minh
          </button>
          <button
            onClick={() => setOpenNow((v) => !v)}
            className={`chip ${openNow ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-200 bg-white text-slate-700"}`}
          >
            <Clock className="h-4 w-4" /> Đang mở cửa
          </button>
          <label className="flex items-center gap-2 whitespace-nowrap text-sm text-slate-600 sm:ml-auto">
            Bán kính
            <select
              value={radius}
              disabled={!loc}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="input w-auto py-1.5 disabled:bg-slate-100"
              title={loc ? "" : "Bấm 'Gần tôi' để cho phép định vị"}
            >
              {RADII.map((r) => (
                <option key={r} value={r}>
                  {r ? `${r} km` : "Tất cả"}
                </option>
              ))}
            </select>
          </label>
        </div>
        {locMsg && <p className="mt-2 text-sm text-amber-700">{locMsg}</p>}
      </div>

      {/* Chuyển bản đồ / danh sách trên điện thoại */}
      <div className="mt-4 grid grid-cols-2 rounded-xl bg-slate-200 p-1 text-sm font-semibold md:hidden">
        <button onClick={() => setMobileView("map")} className={`flex items-center justify-center gap-1.5 rounded-lg py-2 ${mobileView === "map" ? "bg-white shadow" : "text-slate-600"}`}>
          <MapIcon className="h-4 w-4" /> Bản đồ
        </button>
        <button onClick={() => setMobileView("list")} className={`flex items-center justify-center gap-1.5 rounded-lg py-2 ${mobileView === "list" ? "bg-white shadow" : "text-slate-600"}`}>
          <List className="h-4 w-4" /> Danh sách ({total})
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_400px]">
        <div className={`${mobileView === "map" ? "" : "hidden"} md:block`}>
          <div className="lg:sticky lg:top-20">
            <LazyMap
              points={points}
              center={center}
              zoom={zoom}
              userLocation={loc}
              fitToPoints={selected.length > 0 || !!loc}
              focusId={focus}
              className="h-[62vh] min-h-[380px] lg:h-[calc(100vh-7rem)]"
            />
            <p className="mt-2 text-xs text-slate-500">
              {loading ? "Đang tải..." : `${points.length} địa điểm trên bản đồ`}
              {total - points.length > 0 && !loading ? ` · ${total - points.length} cơ sở chưa có toạ độ (xem ở danh sách)` : ""}
            </p>
          </div>
        </div>

        <div className={`${mobileView === "list" ? "" : "hidden"} md:block`}>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">{loc ? "Tiện ích gần bạn" : "Tiện ích nổi bật"}</h2>
              <p className="text-sm text-slate-500">
                {loading ? "Đang tải..." : `Tìm thấy ${total} cơ sở`}
              </p>
            </div>
            <Link href={`/danh-muc?${params}`} className="inline-flex items-center text-sm font-semibold text-navy-700 hover:underline">
              Xem tất cả <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-3 space-y-3 lg:max-h-[calc(100vh-10rem)] lg:overflow-auto lg:pr-1">
            {loading && items.length === 0 && (
              <div className="grid place-items-center py-10 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            {!loading && items.length === 0 && (
              <div className="card p-6 text-center text-sm text-slate-500">
                Không có cơ sở phù hợp. Thử bỏ bớt bộ lọc hoặc tăng bán kính.
              </div>
            )}
            {items.slice(0, 30).map((p) => (
              <div key={p.id} onMouseEnter={() => p.lat && setFocus(p.id)}>
                <PlaceCard p={p} />
              </div>
            ))}
            {items.length > 30 && (
              <Link href={`/danh-muc?${params}`} className="btn btn-outline w-full">
                Xem toàn bộ {total} cơ sở
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
