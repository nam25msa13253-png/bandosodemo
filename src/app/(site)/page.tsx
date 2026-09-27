import Link from "next/link";
import { Building2, ChevronRight, Megaphone, MapPin, PlusCircle } from "lucide-react";
import { SearchHero } from "@/components/site/SearchHero";
import { MapExplorer } from "@/components/site/MapExplorer";
import { WeatherWidget } from "@/components/site/WeatherWidget";
import { EmergencyBox } from "@/components/site/EmergencyBox";
import { getAgencies, getSectors, getSettings } from "@/lib/settings";
import { latestAnnouncements, sectorCounts } from "@/lib/queries";
import { formatDate } from "@/lib/text";
import { SafeImg } from "@/components/site/SafeImg";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [st, sectors, counts, agencies, anns] = await Promise.all([
    getSettings(), getSectors(), sectorCounts(), getAgencies(), latestAnnouncements({ limit: 4 }),
  ]);
  const lat = Number(st.map_center_lat);
  const lng = Number(st.map_center_lng);
  const sectorOpts = sectors
    .map((s) => ({ id: s.id, name: s.name, icon: s.icon, color: s.color, count: counts[s.id] ?? 0 }))
    .sort((a, b) => (b.count > 0 ? 1 : 0) - (a.count > 0 ? 1 : 0));

  return (
    <>
      <SearchHero
        title={st.site_name}
        tagline={st.site_tagline}
        banner={st.banner_url}
        placeholder={st.search_placeholder}
        unitName={st.unit_name}
      />

      <MapExplorer sectors={sectorOpts} center={[lat, lng]} zoom={Number(st.map_zoom) || 14} />

      <section className="mx-auto mt-8 grid max-w-7xl gap-4 px-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="card h-full p-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-bold text-slate-800">
                <Megaphone className="h-5 w-5 text-amber-600" /> Thông báo mới
              </h2>
              <Link href="/thong-bao" className="inline-flex items-center text-sm font-semibold text-navy-700">
                Tất cả <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-3 divide-y divide-slate-100">
              {anns.length === 0 && <p className="py-4 text-sm text-slate-500">Chưa có thông báo.</p>}
              {anns.map((a) => (
                <Link key={a.id} href={`/thong-bao/${a.slug}`} className="block py-3 hover:bg-slate-50">
                  <p className="font-semibold text-slate-800">
                    {a.pinned && <span className="mr-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700">Ghim</span>}
                    {a.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDate(a.publishedAt)} · {a.villageName ?? "Toàn phường"}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <WeatherWidget lat={lat} lng={lng} place={st.weather_place || st.site_short} />
        <EmergencyBox />
      </section>

      {agencies.length > 0 && (
        <section className="mx-auto mt-8 max-w-7xl px-4">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-800">
            <Building2 className="h-5 w-5 text-navy-700" /> Cơ quan, đơn vị
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {agencies.map((a) => (
              <div key={a.id} className="card flex items-center gap-3 p-3">
                <SafeImg
                  src={a.logo ?? ""}
                  className="h-14 w-14 shrink-0 rounded-xl object-contain"
                  fallback={<Building2 className="h-12 w-12 shrink-0 rounded-xl bg-navy-50 p-2.5 text-navy-700" />}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-snug text-slate-800">{a.name}</p>
                  {a.locationUrl && (
                    <a href={a.locationUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-navy-700">
                      <MapPin className="h-3.5 w-3.5" /> Xem vị trí
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {st.allow_submissions === "true" && (
        <section className="mx-auto mt-8 max-w-7xl px-4">
          <div className="flex flex-col items-start gap-3 rounded-2xl bg-gradient-to-r from-navy-800 to-navy-600 p-5 text-white sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="text-lg font-bold">Thông tin chưa đúng hoặc thiếu cơ sở?</p>
              <p className="text-sm text-white/80">Gửi đề xuất để cán bộ phường kiểm tra và cập nhật trong 3 ngày làm việc.</p>
            </div>
            <Link href="/de-xuat" className="btn btn-accent">
              <PlusCircle className="h-4 w-4" /> Gửi đề xuất
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
