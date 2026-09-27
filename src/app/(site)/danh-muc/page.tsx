import type { Metadata } from "next";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";
import { PlaceCard } from "@/components/site/PlaceCard";
import { Pagination } from "@/components/site/Pagination";
import { NearMeFields } from "@/components/site/NearMeFields";
import { SectorIcon } from "@/components/SectorIcon";
import { listPlaces, sectorCounts } from "@/lib/queries";
import { parseFilter } from "@/lib/filters";
import { getSectors, getSettings, getVillages } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Danh mục tiện ích" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function CategoryPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const f = parseFilter(sp);
  f.pageSize = 24;
  const hasLoc = f.lat != null && f.lng != null;
  if (f.sort === "distance" && !hasLoc) f.sort = "relevance";
  const [st, sectors, villages, counts, result] = await Promise.all([
    getSettings(), getSectors(), getVillages(), sectorCounts(), listPlaces(f),
  ]);

  const makeHref = (page: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (k === "page" || v == null) continue;
      (Array.isArray(v) ? v : [v]).forEach((x) => u.append(k, x));
    }
    u.set("page", String(page));
    return `/danh-muc?${u}`;
  };

  return (
    <>
      <PageHeader
        title="Danh mục tiện ích"
        subtitle={`Tra cứu, khám phá các tiện ích, dịch vụ thiết yếu tại ${st.site_name.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}`}
        crumbs={[{ label: "Danh mục" }]}
      />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[300px_1fr]">
        <form className="card h-fit space-y-4 p-4 lg:sticky lg:top-20" action="/danh-muc">
          <p className="flex items-center gap-2 font-bold text-slate-800">
            <SlidersHorizontal className="h-4 w-4" /> Tìm kiếm & lọc
          </p>
          <div>
            <label className="label" htmlFor="q">Từ khóa</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="q" name="q" defaultValue={f.q} placeholder="Tên, SĐT, mô tả..." className="input pl-9" />
            </div>
          </div>
          <div>
            <p className="label">Lĩnh vực</p>
            <div className="max-h-64 space-y-1 overflow-auto pr-1">
              {sectors.map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 text-sm hover:bg-slate-50">
                  <input type="checkbox" name="sector" value={s.id} defaultChecked={f.sectors?.includes(s.id)} className="h-4 w-4 accent-navy-800" />
                  <SectorIcon name={s.icon} className="h-4 w-4" style={{ color: s.color }} />
                  <span className="flex-1">{s.name}</span>
                  <span className="text-xs text-slate-400">{counts[s.id] ?? 0}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="village">{st.unit_name}</label>
            <select id="village" name="village" defaultValue={f.village ?? ""} className="input">
              <option value="">Tất cả</option>
              {villages.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="verified" value="1" defaultChecked={f.verified} className="h-4 w-4 accent-navy-800" /> Chỉ cơ sở đã xác minh
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="open" value="1" defaultChecked={f.openNow} className="h-4 w-4 accent-navy-800" /> Đang mở cửa
            </label>
          </div>
          <NearMeFields lat={f.lat} lng={f.lng} radius={f.radiusKm} />
          <div>
            <label className="label" htmlFor="sort">Sắp xếp</label>
            <select id="sort" name="sort" defaultValue={f.sort} className="input">
              <option value="relevance">Liên quan</option>
              <option value="name">A → Z</option>
              <option value="distance">Khoảng cách (cần vị trí)</option>
              <option value="popular">Xem nhiều</option>
              <option value="updated">Mới cập nhật</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary flex-1">Áp dụng</button>
            <Link href="/danh-muc" className="btn btn-outline">Đặt lại</Link>
          </div>
        </form>

        <div>
          <p className="text-sm text-slate-600">
            Tìm thấy <b className="text-slate-900">{result.total}</b> tiện ích
            {f.q ? <> cho “<b>{f.q}</b>”</> : null}
          </p>
          {result.items.length === 0 ? (
            <div className="card mt-4 p-8 text-center">
              <p className="font-semibold text-slate-800">Không tìm thấy cơ sở phù hợp</p>
              <p className="mt-1 text-sm text-slate-500">Thử bỏ bớt bộ lọc, dùng từ khóa ngắn hơn, hoặc gửi đề xuất nếu cơ sở chưa có.</p>
              <Link href="/de-xuat" className="btn btn-accent mt-4">Đề xuất cơ sở mới</Link>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {result.items.map((p) => (
                <PlaceCard key={p.id} p={p} />
              ))}
            </div>
          )}
          <Pagination page={f.page ?? 1} total={result.total} pageSize={f.pageSize!} makeHref={makeHref} />
        </div>
      </div>
    </>
  );
}
