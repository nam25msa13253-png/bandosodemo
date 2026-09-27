import Link from "next/link";
import { and, desc, eq, gt, sql, type SQL } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireUser } from "@/lib/auth";
import { AdminTitle, StatCard } from "@/components/admin/ui";
import { formatDate } from "@/lib/text";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const user = await requireUser();
  const { err } = await searchParams;
  const scope: SQL | undefined = user.role === "VILLAGE" ? eq(s.places.villageId, user.villageId ?? -1) : undefined;
  const since = new Date(Date.now() - 30 * 86400_000);

  const [[stats], events, top, pendingList] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        verified: sql<number>`count(*) filter (where ${s.places.verified})::int`,
        noCoords: sql<number>`count(*) filter (where ${s.places.lat} is null)::int`,
        noPhone: sql<number>`count(*) filter (where cardinality(${s.places.phones}) = 0)::int`,
        noHours: sql<number>`count(*) filter (where ${s.places.openingHours} is null)::int`,
        noImage: sql<number>`count(*) filter (where cardinality(${s.places.images}) = 0)::int`,
        noVillage: sql<number>`count(*) filter (where ${s.places.villageId} is null)::int`,
        inactive: sql<number>`count(*) filter (where ${s.places.status} <> 'ACTIVE')::int`,
      })
      .from(s.places)
      .where(scope),
    db
      .select({ type: s.placeEvents.type, n: sql<number>`count(*)::int` })
      .from(s.placeEvents)
      .innerJoin(s.places, eq(s.places.id, s.placeEvents.placeId))
      .where(and(gt(s.placeEvents.createdAt, since), scope))
      .groupBy(s.placeEvents.type),
    db
      .select({ id: s.places.id, name: s.places.name, slug: s.places.slug, views: s.places.viewCount })
      .from(s.places)
      .where(scope)
      .orderBy(desc(s.places.viewCount))
      .limit(8),
    db
      .select({ id: s.submissions.id, type: s.submissions.type, name: s.submissions.name, content: s.submissions.content, createdAt: s.submissions.createdAt })
      .from(s.submissions)
      .where(eq(s.submissions.status, "PENDING"))
      .orderBy(desc(s.submissions.createdAt))
      .limit(5),
  ]);
  const ev = Object.fromEntries(events.map((e) => [e.type, e.n]));
  const pct = stats.total ? Math.round((stats.verified / stats.total) * 100) : 0;

  return (
    <>
      <AdminTitle title={`Xin chào, ${user.fullName}`} desc={user.role === "VILLAGE" ? "Số liệu thuộc tổ dân phố của bạn" : "Tổng quan toàn phường"} />
      {err === "forbidden" && <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">Bạn không có quyền truy cập chức năng đó.</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cơ sở dịch vụ" value={stats.total} href="/admin/co-so" />
        <StatCard label="Đã xác minh" value={`${stats.verified} (${pct}%)`} tone="emerald" href="/admin/co-so?verified=0" />
        <StatCard label="Đóng góp chờ duyệt" value={pendingList.length} tone="rose" href="/admin/dong-gop" />
        <StatCard label="Lượt xem 30 ngày" value={ev.view ?? 0} tone="amber" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <p className="font-bold text-slate-800">Dữ liệu cần bổ sung</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {[
              ["coords", "Chưa có toạ độ", stats.noCoords],
              ["phone", "Chưa có SĐT", stats.noPhone],
              ["hours", "Chưa có giờ hoạt động", stats.noHours],
              ["image", "Chưa có ảnh", stats.noImage],
              ["village", "Chưa gán tổ dân phố", stats.noVillage],
              ["unverified", "Chưa xác minh", stats.total - stats.verified],
            ].map(([k, l, n]) => (
              <Link key={k as string} href={`/admin/co-so?missing=${k}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 hover:bg-slate-100">
                <span>{l}</span>
                <b className={Number(n) > 0 ? "text-rose-600" : "text-emerald-600"}>{n}</b>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Bấm vào từng mục để mở danh sách cơ sở cần xử lý.</p>
        </div>
        <div className="card p-4">
          <p className="font-bold text-slate-800">Tương tác 30 ngày qua</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-emerald-50 p-3"><p className="text-2xl font-extrabold text-emerald-700">{ev.call ?? 0}</p><p className="text-xs text-slate-600">Lượt bấm gọi</p></div>
            <div className="rounded-xl bg-amber-50 p-3"><p className="text-2xl font-extrabold text-amber-700">{ev.direction ?? 0}</p><p className="text-xs text-slate-600">Lượt chỉ đường</p></div>
            <div className="rounded-xl bg-navy-50 p-3"><p className="text-2xl font-extrabold text-navy-700">{ev.share ?? 0}</p><p className="text-xs text-slate-600">Lượt chia sẻ</p></div>
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-700">Xem nhiều nhất</p>
          <ol className="mt-1 space-y-1 text-sm">
            {top.map((t, i) => (
              <li key={t.id} className="flex justify-between gap-2">
                <Link href={`/admin/co-so/${t.id}`} className="truncate hover:text-navy-700">{i + 1}. {t.name}</Link>
                <span className="text-slate-500">{t.views}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {pendingList.length > 0 && (
        <div className="card mt-4 p-4">
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-800">Đóng góp mới nhất</p>
            <Link href="/admin/dong-gop" className="text-sm font-semibold text-navy-700">Xử lý →</Link>
          </div>
          <div className="mt-2 divide-y divide-slate-100 text-sm">
            {pendingList.map((p) => (
              <Link key={p.id} href={`/admin/dong-gop/${p.id}`} className="block py-2 hover:bg-slate-50">
                <b>{p.name ?? p.type}</b> – <span className="text-slate-600">{p.content.slice(0, 100)}</span>
                <span className="ml-2 text-xs text-slate-400">{formatDate(p.createdAt, true)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
