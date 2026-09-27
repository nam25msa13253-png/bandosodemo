import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/text";
import { AdminTitle, Flash } from "@/components/admin/ui";
import { SUB_STATUS, SUB_TYPES } from "./labels";

export default async function Submissions({ searchParams }: { searchParams: Promise<{ status?: string; msg?: string }> }) {
  await requireUser();
  const { status = "PENDING", msg } = await searchParams;
  const rows = await db
    .select({
      id: s.submissions.id, type: s.submissions.type, name: s.submissions.name, content: s.submissions.content,
      status: s.submissions.status, createdAt: s.submissions.createdAt, placeName: s.places.name,
    })
    .from(s.submissions)
    .leftJoin(s.places, eq(s.places.id, s.submissions.placeId))
    .where(status === "ALL" ? undefined : eq(s.submissions.status, status as "PENDING"))
    .orderBy(desc(s.submissions.createdAt))
    .limit(200);
  const overdue = (d: Date) => Date.now() - d.getTime() > 3 * 86400_000;
  return (
    <>
      <AdminTitle title="Đóng góp của người dân" desc="Đề xuất cơ sở mới và báo sai thông tin – mục tiêu xử lý trong 3 ngày làm việc" />
      <Flash msg={msg === "done" ? "Đã xử lý đóng góp." : undefined} />
      <div className="mb-3 flex flex-wrap gap-2">
        {["PENDING", "ACCEPTED", "REJECTED", "ALL"].map((k) => (
          <Link key={k} href={`/admin/dong-gop?status=${k}`} className={`chip ${status === k ? "border-navy-800 bg-navy-800 text-white" : "border-slate-200 bg-white"}`}>
            {k === "ALL" ? "Tất cả" : SUB_STATUS[k]}
          </Link>
        ))}
      </div>
      <div className="card divide-y divide-slate-100">
        {rows.length === 0 && <p className="p-6 text-center text-sm text-slate-500">Không có đóng góp nào.</p>}
        {rows.map((r) => (
          <Link key={r.id} href={`/admin/dong-gop/${r.id}`} className="flex flex-wrap items-start gap-3 p-3 hover:bg-slate-50">
            <span className="rounded-lg bg-navy-50 px-2 py-1 text-xs font-bold text-navy-700">{SUB_TYPES[r.type]}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-slate-800">{r.placeName ?? r.name ?? "(không tên)"}</span>
              <span className="block truncate text-sm text-slate-600">{r.content}</span>
            </span>
            <span className="text-right text-xs text-slate-500">
              {formatDate(r.createdAt, true)}
              {r.status === "PENDING" && overdue(r.createdAt) && <span className="ml-1 rounded bg-rose-100 px-1.5 font-bold text-rose-700">Quá hạn</span>}
              {r.status !== "PENDING" && <span className="block">{SUB_STATUS[r.status]}</span>}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
