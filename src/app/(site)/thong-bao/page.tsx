import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, Search } from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";
import { latestAnnouncements } from "@/lib/queries";
import { getSettings, getVillages } from "@/lib/settings";
import { formatDate } from "@/lib/text";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Thông báo" };

export default async function AnnouncementsPage({ searchParams }: { searchParams: Promise<{ village?: string; q?: string }> }) {
  const sp = await searchParams;
  const villageId = Number(sp.village) || null;
  const [st, villages, list] = await Promise.all([
    getSettings(), getVillages(), latestAnnouncements({ villageId, q: sp.q, limit: 100 }),
  ]);
  return (
    <>
      <PageHeader title="Thông báo" subtitle="Các thông báo mới nhất từ chính quyền địa phương" crumbs={[{ label: "Thông báo" }]} />
      <div className="mx-auto max-w-4xl px-4 py-6">
        <form className="card flex flex-col gap-2 p-3 sm:flex-row" action="/thong-bao">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={sp.q} placeholder="Tìm thông báo..." className="input pl-9" />
          </div>
          <select name="village" defaultValue={villageId ?? ""} className="input sm:w-56">
            <option value="">Tất cả {st.unit_name.toLowerCase()}</option>
            {villages.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <button className="btn btn-primary">Lọc</button>
        </form>
        <div className="mt-4 space-y-3">
          {list.length === 0 && (
            <div className="card p-8 text-center">
              <Megaphone className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 font-semibold text-slate-700">Không tìm thấy thông báo</p>
              <p className="text-sm text-slate-500">Thử điều chỉnh từ khoá tìm kiếm hoặc bộ lọc.</p>
            </div>
          )}
          {list.map((a) => (
            <Link key={a.id} href={`/thong-bao/${a.slug}`} className="card block p-4 transition hover:border-navy-600">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {a.pinned && <span className="rounded bg-amber-100 px-1.5 py-0.5 font-bold uppercase text-amber-700">Ghim</span>}
                <span className="rounded bg-navy-50 px-1.5 py-0.5 font-semibold text-navy-700">{a.villageName ?? "Toàn phường"}</span>
                <span>{formatDate(a.publishedAt, true)}</span>
              </div>
              <h2 className="mt-1.5 text-lg font-bold text-slate-800">{a.title}</h2>
              {a.summary && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{a.summary}</p>}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
