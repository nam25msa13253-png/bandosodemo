import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, Search, Users, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";
import { PlaceCard } from "@/components/site/PlaceCard";
import { unifiedSearch } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tìm kiếm" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const { q = "", type } = await searchParams;
  const st = await getSettings();
  const r = q.trim() ? await unifiedSearch(q, 30) : null;
  const showV = !type || type === "village";
  const showP = !type || type === "place";
  const total = r ? (showV ? r.villages.length : 0) + (showP ? r.placesTotal ?? 0 : 0) + (!type ? r.announcements.length : 0) : 0;

  return (
    <>
      <PageHeader title="Tra cứu" subtitle={`Tìm ${st.unit_name.toLowerCase()}, cán bộ, cơ sở dịch vụ và thông báo trong một ô`} crumbs={[{ label: "Tìm kiếm" }]} />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <form action="/tim-kiem" className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={q} autoFocus placeholder={st.search_placeholder} className="input h-12 pl-10 text-base" />
          </div>
          <select name="type" defaultValue={type ?? ""} className="input h-12 w-auto">
            <option value="">Tất cả</option>
            <option value="place">Dịch vụ tiện ích</option>
            <option value="village">{st.unit_name}</option>
          </select>
          <button className="btn btn-accent h-12 px-5">Tìm</button>
        </form>

        {r && <p className="mt-4 text-sm text-slate-600">Tìm thấy <b>{total}</b> kết quả cho “<b>{q}</b>”</p>}
        {r && total === 0 && (
          <div className="card mt-4 p-6 text-center text-sm text-slate-500">
            Không có kết quả. Thử từ khoá ngắn hơn (VD: “phở”, “thuốc”, “tổ 5”) hoặc{" "}
            <Link href="/de-xuat" className="font-semibold text-navy-700">đề xuất cơ sở mới</Link>.
          </div>
        )}

        {r && showV && r.villages.length > 0 && (
          <section className="mt-6">
            <h2 className="flex items-center gap-2 font-bold text-slate-800"><Users className="h-5 w-5" /> {st.unit_name} ({r.villages.length})</h2>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {r.villages.map((v) => (
                <Link key={v.id} href={`/to-dan-pho/${v.slug}`} className="card flex items-center gap-3 p-3 hover:border-navy-600">
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-slate-800">{v.name}</span>
                    <span className="block truncate text-xs text-slate-500">Sáp nhập từ: {v.mergedFrom}</span>
                    <span className="block text-xs text-slate-500">Tổ trưởng: {v.leaderName ?? "—"} · Bí thư: {v.secretaryName ?? "—"}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {r && showP && r.places.length > 0 && (
          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Dịch vụ tiện ích ({r.placesTotal})</h2>
              {(r.placesTotal ?? 0) > r.places.length && (
                <Link href={`/danh-muc?q=${encodeURIComponent(q)}`} className="text-sm font-semibold text-navy-700">Xem tất cả & lọc</Link>
              )}
            </div>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {r.places.map((p) => <PlaceCard key={p.id} p={p} />)}
            </div>
          </section>
        )}

        {r && !type && r.announcements.length > 0 && (
          <section className="mt-6">
            <h2 className="flex items-center gap-2 font-bold text-slate-800"><Megaphone className="h-5 w-5" /> Thông báo</h2>
            <div className="mt-2 space-y-2">
              {r.announcements.map((a) => (
                <Link key={a.slug} href={`/thong-bao/${a.slug}`} className="card block p-3 font-semibold text-slate-800 hover:border-navy-600">{a.title}</Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
