import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ExternalLink, Home, Megaphone, Phone, Ruler, Store, UserRound, Users } from "lucide-react";
import { db, schema as s } from "@/db";
import { PageHeader } from "@/components/site/PageHeader";
import { PlaceCard } from "@/components/site/PlaceCard";
import { LazyMap } from "@/components/map/LazyMap";
import { latestAnnouncements, listPlaces } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { formatDate, formatNumber, formatPhone } from "@/lib/text";

export const dynamic = "force-dynamic";
type Params = Promise<{ slug: string }>;

async function getVillage(slug: string) {
  return db.query.villages.findFirst({ where: eq(s.villages.slug, slug) });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const v = await getVillage((await params).slug);
  return v ? { title: v.name, description: `${v.name} – sáp nhập từ ${v.mergedFrom ?? ""}. Tổ trưởng: ${v.leaderName ?? ""}` } : {};
}

export default async function VillageDetail({ params, searchParams }: { params: Params; searchParams: Promise<{ page?: string }> }) {
  const v = await getVillage((await params).slug);
  if (!v) notFound();
  const page = Number((await searchParams).page) || 1;
  const [st, places, allInVillage, anns] = await Promise.all([
    getSettings(),
    listPlaces({ village: v.id, pageSize: 24, page, sort: "name" }),
    listPlaces({ village: v.id, pageSize: 1000, withCoords: true }),
    latestAnnouncements({ villageId: v.id, limit: 5 }),
  ]);
  const showPhones = st.show_official_phones !== "false";
  const officials = [
    { role: "Bí thư chi bộ", name: v.secretaryName, phone: v.secretaryPhone },
    { role: "Tổ trưởng", name: v.leaderName, phone: v.leaderPhone },
    { role: "Trưởng ban công tác Mặt trận", name: v.frontHeadName, phone: v.frontHeadPhone },
  ].filter((o) => o.name);
  const pts = allInVillage.items.map((p) => ({
    id: p.id, slug: p.slug, name: p.name, sectorName: p.sectorName, color: p.sectorColor, lat: p.lat!, lng: p.lng!, phone: p.phones[0], image: p.image,
  }));
  const center: [number, number] = pts.length
    ? [pts.reduce((a, p) => a + p.lat, 0) / pts.length, pts.reduce((a, p) => a + p.lng, 0) / pts.length]
    : [Number(st.map_center_lat), Number(st.map_center_lng)];

  return (
    <>
      <PageHeader title={v.name} subtitle={v.mergedFrom ? `Sáp nhập từ: ${v.mergedFrom}` : undefined} crumbs={[{ href: "/ban-do-hanh-chinh", label: st.unit_name }, { label: v.name }]} />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Stat icon={<Users className="h-5 w-5" />} label="Nhân khẩu" value={formatNumber(v.population)} />
          <Stat icon={<Home className="h-5 w-5" />} label="Số hộ" value={formatNumber(v.households)} />
          <Stat icon={<Store className="h-5 w-5" />} label="Cơ sở dịch vụ" value={formatNumber(places.total)} />
          <Stat icon={<Ruler className="h-5 w-5" />} label="Diện tích" value={v.areaHa ? `${v.areaHa} ha` : "Chưa cập nhật"} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {pts.length > 0 && <LazyMap className="h-80" points={pts} center={center} zoom={15} fitToPoints />}
            {v.locationUrl && (
              <a href={v.locationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-navy-700">
                Xem vị trí nhà văn hoá / khu vực trên Google Maps <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <div className="space-y-4">
            <div className="card p-4">
              <p className="font-bold text-slate-800">Cán bộ {st.unit_name.toLowerCase()}</p>
              <div className="mt-3 space-y-2">
                {officials.map((o) => (
                  <div key={o.role} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                    <UserRound className="h-9 w-9 shrink-0 rounded-full bg-navy-100 p-1.5 text-navy-700" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-500">{o.role}</p>
                      <p className="font-semibold text-slate-800">{o.name}</p>
                    </div>
                    {showPhones && o.phone && (
                      <a href={`tel:${o.phone}`} className="btn btn-green px-3" title={formatPhone(o.phone)}>
                        <Phone className="h-4 w-4" /> Gọi
                      </a>
                    )}
                  </div>
                ))}
                {officials.length === 0 && <p className="text-sm text-slate-500">Chưa cập nhật.</p>}
              </div>
            </div>
            <div className="card p-4">
              <p className="flex items-center gap-2 font-bold text-slate-800"><Megaphone className="h-4 w-4 text-amber-600" /> Thông báo</p>
              <div className="mt-2 divide-y divide-slate-100">
                {anns.map((a) => (
                  <Link key={a.id} href={`/thong-bao/${a.slug}`} className="block py-2.5">
                    <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                    <p className="text-xs text-slate-500">{formatDate(a.publishedAt)} · {a.villageName ?? "Toàn phường"}</p>
                  </Link>
                ))}
                {anns.length === 0 && <p className="py-2 text-sm text-slate-500">Chưa có thông báo.</p>}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-extrabold text-slate-800">Cơ sở dịch vụ trên địa bàn ({places.total})</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {places.items.map((p) => <PlaceCard key={p.id} p={p} />)}
          </div>
          {places.total > 24 && (
            <div className="mt-4 text-center">
              <Link href={`/danh-muc?village=${v.id}`} className="btn btn-outline">Xem tất cả & lọc theo lĩnh vực</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-50 text-navy-700">{icon}</span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-extrabold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
