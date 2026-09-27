import { desc, eq, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/text";
import { AdminTitle } from "@/components/admin/ui";
import { Pagination } from "@/components/site/Pagination";

const ACT: Record<string, string> = { create: "Thêm", update: "Sửa", delete: "Xoá", verify: "Xác minh", login: "Đăng nhập", accept: "Chấp nhận", reject: "Từ chối" };

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string; entity?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Number(sp.page) || 1;
  const where = sp.entity ? eq(s.auditLogs.entity, sp.entity) : undefined;
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(s.auditLogs).where(where).orderBy(desc(s.auditLogs.createdAt)).limit(50).offset((page - 1) * 50),
    db.select({ total: sql<number>`count(*)::int` }).from(s.auditLogs).where(where),
  ]);
  return (
    <>
      <AdminTitle title="Nhật ký thay đổi" desc="Ai đã thay đổi gì, lúc nào" />
      <div className="card divide-y divide-slate-100 text-sm">
        {rows.map((r) => (
          <div key={r.id} className="flex flex-wrap gap-x-3 gap-y-0.5 px-3 py-2">
            <span className="w-36 shrink-0 text-xs text-slate-500">{formatDate(r.createdAt, true)}</span>
            <span className="w-24 shrink-0 font-semibold">{r.username ?? "—"}</span>
            <span className="rounded bg-slate-100 px-1.5 text-xs font-semibold text-slate-600">{ACT[r.action] ?? r.action}</span>
            <span className="min-w-0 flex-1 text-slate-700">{r.summary}</span>
          </div>
        ))}
        {rows.length === 0 && <p className="p-6 text-center text-slate-500">Chưa có nhật ký.</p>}
      </div>
      <Pagination page={page} total={total} pageSize={50} makeHref={(p) => `/admin/nhat-ky?page=${p}${sp.entity ? `&entity=${sp.entity}` : ""}`} />
    </>
  );
}
