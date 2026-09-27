import Link from "next/link";
import { and, asc, desc, eq, isNull, like, sql, type SQL } from "drizzle-orm";
import { BadgeCheck, Download, Plus } from "lucide-react";
import { db, schema as s } from "@/db";
import { requireUser } from "@/lib/auth";
import { getSectors, getVillages } from "@/lib/settings";
import { tokens } from "@/lib/text";
import { AdminTitle, Flash } from "@/components/admin/ui";
import { Pagination } from "@/components/site/Pagination";
import { toggleVerified } from "./actions";

const PAGE = 30;
const MISSING: Record<string, { label: string; cond: SQL }> = {
  coords: { label: "Chưa có toạ độ", cond: isNull(s.places.lat) },
  phone: { label: "Chưa có SĐT", cond: sql`cardinality(${s.places.phones}) = 0` },
  hours: { label: "Chưa có giờ hoạt động", cond: isNull(s.places.openingHours) },
  image: { label: "Chưa có ảnh", cond: sql`cardinality(${s.places.images}) = 0` },
  village: { label: "Chưa gán tổ", cond: isNull(s.places.villageId) },
  unverified: { label: "Chưa xác minh", cond: eq(s.places.verified, false) },
};

type SP = Promise<Record<string, string | undefined>>;

export default async function AdminPlaces({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const where: SQL[] = tokens(sp.q ?? "").map((t) => like(s.places.searchText, `%${t}%`));
  if (user.role === "VILLAGE") where.push(eq(s.places.villageId, user.villageId ?? -1));
  else if (sp.village) where.push(eq(s.places.villageId, Number(sp.village)));
  if (sp.sector) where.push(eq(s.places.sectorId, sp.sector));
  if (sp.status) where.push(eq(s.places.status, sp.status as "ACTIVE"));
  if (sp.missing && MISSING[sp.missing]) where.push(MISSING[sp.missing].cond);

  const [sectors, villages, rows, [{ total }]] = await Promise.all([
    getSectors(),
    getVillages(),
    db
      .select({
        id: s.places.id, name: s.places.name, slug: s.places.slug, phones: s.places.phones, lat: s.places.lat,
        verified: s.places.verified, status: s.places.status, updatedAt: s.places.updatedAt,
        sectorName: s.sectors.name, sectorColor: s.sectors.color, villageName: s.villages.name,
      })
      .from(s.places)
      .innerJoin(s.sectors, eq(s.sectors.id, s.places.sectorId))
      .leftJoin(s.villages, eq(s.villages.id, s.places.villageId))
      .where(and(...where))
      .orderBy(sp.sort === "name" ? asc(s.places.name) : desc(s.places.updatedAt))
      .limit(PAGE)
      .offset((page - 1) * PAGE),
    db.select({ total: sql<number>`count(*)::int` }).from(s.places).where(and(...where)),
  ]);
  const qs = (p: number) => {
    const u = new URLSearchParams(Object.entries(sp).filter(([k, v]) => k !== "page" && k !== "msg" && v) as [string, string][]);
    u.set("page", String(p));
    return `/admin/co-so?${u}`;
  };

  return (
    <>
      <AdminTitle
        title="Cơ sở dịch vụ"
        desc={`${total} cơ sở${sp.missing ? ` · ${MISSING[sp.missing]?.label}` : ""}`}
        actions={
          <>
            <a href={`/api/admin/export?${new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][])}`} className="btn btn-outline">
              <Download className="h-4 w-4" /> Xuất Excel (CSV)
            </a>
            <Link href="/admin/co-so/moi" className="btn btn-primary"><Plus className="h-4 w-4" /> Thêm cơ sở</Link>
          </>
        }
      />
      <Flash msg={sp.msg === "deleted" ? "Đã xoá cơ sở." : undefined} />
      <form className="card mb-4 grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-6">
        <input name="q" defaultValue={sp.q} placeholder="Tìm tên, SĐT..." className="input lg:col-span-2" />
        <select name="sector" defaultValue={sp.sector ?? ""} className="input">
          <option value="">Mọi lĩnh vực</option>
          {sectors.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
        {user.role === "ADMIN" && (
          <select name="village" defaultValue={sp.village ?? ""} className="input">
            <option value="">Mọi tổ</option>
            {villages.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        )}
        <select name="missing" defaultValue={sp.missing ?? ""} className="input">
          <option value="">Dữ liệu: tất cả</option>
          {Object.entries(MISSING).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div className="flex gap-2">
          <select name="status" defaultValue={sp.status ?? ""} className="input">
            <option value="">Mọi trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Ngừng HĐ</option>
            <option value="HIDDEN">Đang ẩn</option>
          </select>
          <button className="btn btn-primary">Lọc</button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2.5">Tên cơ sở</th>
              <th className="px-3 py-2.5">Lĩnh vực</th>
              <th className="px-3 py-2.5">Tổ</th>
              <th className="px-3 py-2.5">SĐT</th>
              <th className="px-3 py-2.5">Toạ độ</th>
              <th className="px-3 py-2.5">Xác minh</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className={r.status !== "ACTIVE" ? "bg-slate-50 text-slate-400" : ""}>
                <td className="px-3 py-2">
                  <Link href={`/admin/co-so/${r.id}`} className="font-semibold text-slate-800 hover:text-navy-700">{r.name}</Link>
                  {r.status !== "ACTIVE" && <span className="ml-2 rounded bg-slate-200 px-1.5 text-[10px] font-bold text-slate-600">{r.status === "HIDDEN" ? "ẨN" : "NGỪNG HĐ"}</span>}
                </td>
                <td className="px-3 py-2"><span className="inline-block h-2 w-2 rounded-full" style={{ background: r.sectorColor }} /> {r.sectorName}</td>
                <td className="px-3 py-2">{r.villageName?.replace("Tổ dân phố", "TDP") ?? <span className="text-rose-500">—</span>}</td>
                <td className="px-3 py-2">{r.phones.join(", ") || <span className="text-rose-500">—</span>}</td>
                <td className="px-3 py-2">{r.lat != null ? "✓" : <span className="text-rose-500">Thiếu</span>}</td>
                <td className="px-3 py-2">
                  <form action={toggleVerified}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${r.verified ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-500 hover:bg-sky-50"}`}>
                      <BadgeCheck className="h-3.5 w-3.5" /> {r.verified ? "Đã XM" : "Xác minh"}
                    </button>
                  </form>
                </td>
                <td className="px-3 py-2 text-right">
                  <Link href={`/dich-vu/${r.slug}`} target="_blank" className="text-xs text-slate-500 hover:text-navy-700">Xem ↗</Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-slate-500">Không có cơ sở nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} pageSize={PAGE} makeHref={qs} />
    </>
  );
}
