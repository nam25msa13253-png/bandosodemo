import type { Metadata } from "next";
import Link from "next/link";
import { Home, Users, Store, ChevronRight, Search } from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";
import { VillageMap } from "@/components/site/VillageMap";
import { getSettings, getVillages } from "@/lib/settings";
import { villageCounts } from "@/lib/queries";
import { formatNumber, tokens } from "@/lib/text";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tổ dân phố – Bản đồ hành chính" };

export default async function VillagesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const [st, villages, counts] = await Promise.all([getSettings(), getVillages(), villageCounts()]);
  const toks = tokens(q ?? "");
  const list = toks.length ? villages.filter((v) => toks.every((t) => v.searchText.includes(t))) : villages;
  const totalPop = villages.reduce((a, v) => a + (v.population ?? 0), 0);
  const totalHh = villages.reduce((a, v) => a + (v.households ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Bản đồ hành chính"
        subtitle={`${villages.length} ${st.unit_name.toLowerCase()} · ${formatNumber(totalPop)} nhân khẩu · ${formatNumber(totalHh)} hộ`}
        crumbs={[{ label: st.unit_name }]}
      />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_380px]">
        <VillageMap
          image={st.admin_map_url}
          villages={villages.map((v) => ({
            id: v.id, code: v.code, name: v.name, slug: v.slug, polygon: v.polygon,
            population: v.population, households: v.households, placeCount: counts[v.id] ?? 0,
          }))}
        />
        <div>
          <form className="relative" action="/ban-do-hanh-chinh">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={q} placeholder="Tên tổ cũ/mới, tên cán bộ..." className="input pl-9" />
          </form>
          <p className="mt-3 text-sm font-semibold text-slate-600">Danh sách {st.unit_name.toLowerCase()} ({list.length})</p>
          <div className="mt-2 space-y-2 lg:max-h-[calc(100vh-14rem)] lg:overflow-auto lg:pr-1">
            {list.map((v) => (
              <Link key={v.id} href={`/to-dan-pho/${v.slug}`} className="card flex items-center gap-3 p-3 transition hover:border-navy-600">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy-800 text-lg font-extrabold text-accent">{v.code}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-slate-800">{v.name}</span>
                  <span className="block truncate text-xs text-slate-500">Sáp nhập từ: {v.mergedFrom ?? "—"}</span>
                  <span className="mt-1 flex gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {formatNumber(v.population)}</span>
                    <span className="inline-flex items-center gap-1"><Home className="h-3.5 w-3.5" /> {formatNumber(v.households)} hộ</span>
                    <span className="inline-flex items-center gap-1"><Store className="h-3.5 w-3.5" /> {counts[v.id] ?? 0}</span>
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </Link>
            ))}
            {list.length === 0 && <p className="card p-4 text-sm text-slate-500">Không tìm thấy tổ dân phố phù hợp.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
