import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Plus } from "lucide-react";
import { db, schema as s } from "@/db";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/text";
import { AdminTitle, Flash } from "@/components/admin/ui";

export default async function AdminAnnouncements({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  const user = await requireUser();
  const { msg, err } = await searchParams;
  const rows = await db
    .select({
      id: s.announcements.id, title: s.announcements.title, published: s.announcements.published, pinned: s.announcements.pinned,
      publishedAt: s.announcements.publishedAt, expiresAt: s.announcements.expiresAt, villageName: s.villages.name, villageId: s.announcements.villageId,
    })
    .from(s.announcements)
    .leftJoin(s.villages, eq(s.villages.id, s.announcements.villageId))
    .orderBy(desc(s.announcements.publishedAt));
  return (
    <>
      <AdminTitle title="Thông báo" actions={<Link href="/admin/thong-bao/moi" className="btn btn-primary"><Plus className="h-4 w-4" /> Soạn thông báo</Link>} />
      <Flash msg={msg === "deleted" ? "Đã xoá thông báo." : undefined} err={err === "forbidden" ? "Bạn không có quyền với thông báo này." : undefined} />
      <div className="card divide-y divide-slate-100">
        {rows.length === 0 && <p className="p-6 text-center text-sm text-slate-500">Chưa có thông báo.</p>}
        {rows.map((r) => {
          const editable = user.role === "ADMIN" || r.villageId === user.villageId;
          const expired = r.expiresAt && r.expiresAt < new Date();
          const scheduled = r.publishedAt > new Date();
          return (
            <div key={r.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                {editable ? (
                  <Link href={`/admin/thong-bao/${r.id}`} className="font-semibold text-slate-800 hover:text-navy-700">{r.title}</Link>
                ) : (
                  <span className="font-semibold text-slate-800">{r.title}</span>
                )}
                <p className="text-xs text-slate-500">{formatDate(r.publishedAt, true)} · {r.villageName ?? "Toàn phường"}</p>
              </div>
              <div className="flex gap-1 text-[11px] font-bold">
                {r.pinned && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">GHIM</span>}
                {!r.published && <span className="rounded bg-slate-200 px-1.5 py-0.5 text-slate-600">NHÁP</span>}
                {scheduled && r.published && <span className="rounded bg-sky-100 px-1.5 py-0.5 text-sky-700">HẸN GIỜ</span>}
                {expired && <span className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-700">HẾT HẠN</span>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
