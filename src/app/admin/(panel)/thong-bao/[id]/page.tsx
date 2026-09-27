import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Save, Trash2 } from "lucide-react";
import { db, schema as s } from "@/db";
import { canEditVillage, requireUser } from "@/lib/auth";
import { getVillages } from "@/lib/settings";
import { AdminTitle, Flash } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { deleteAnnouncement, saveAnnouncement } from "../actions";

function local(d: Date | null | undefined) {
  if (!d) return "";
  const t = new Date(d.getTime() + 7 * 3600_000);
  return t.toISOString().slice(0, 16);
}

export default async function EditAnnouncement({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string; err?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const { msg, err } = await searchParams;
  const a = id === "moi" ? null : await db.query.announcements.findFirst({ where: eq(s.announcements.id, id) });
  if (id !== "moi" && !a) notFound();
  if (a && !canEditVillage(user, a.villageId)) return <p className="card p-6 text-rose-700">Bạn không có quyền sửa thông báo này.</p>;
  const villages = await getVillages();
  return (
    <>
      <AdminTitle title={a ? "Sửa thông báo" : "Soạn thông báo"} />
      <Flash msg={msg === "saved" ? "Đã lưu thông báo." : undefined} err={err === "missing" ? "Tiêu đề và nội dung là bắt buộc." : undefined} />
      <form action={saveAnnouncement} className="card max-w-3xl space-y-3 p-4">
        {a && <input type="hidden" name="id" value={a.id} />}
        <div>
          <label className="label">Tiêu đề *</label>
          <input name="title" defaultValue={a?.title} required className="input" />
        </div>
        <div>
          <label className="label">Tóm tắt (hiện ở danh sách)</label>
          <input name="summary" defaultValue={a?.summary ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Nội dung *</label>
          <textarea name="content" rows={10} defaultValue={a?.content} required className="input" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Phạm vi</label>
            <select name="villageId" defaultValue={(user.role === "VILLAGE" ? user.villageId : a?.villageId) ?? ""} disabled={user.role !== "ADMIN"} className="input disabled:bg-slate-100">
              <option value="">Toàn phường</option>
              {villages.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Thời điểm đăng</label>
            <input type="datetime-local" name="publishedAt" defaultValue={local(a?.publishedAt ?? new Date())} className="input" />
          </div>
          <div>
            <label className="label">Hết hạn (tự ẩn)</label>
            <input type="datetime-local" name="expiresAt" defaultValue={local(a?.expiresAt)} className="input" />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={a?.published ?? true} className="h-4 w-4 accent-navy-800" /> Công khai</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="pinned" defaultChecked={a?.pinned} className="h-4 w-4 accent-navy-800" /> Ghim lên đầu</label>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary"><Save className="h-4 w-4" /> Lưu</button>
        </div>
      </form>
      {a && (
        <form action={deleteAnnouncement} className="mt-3">
          <input type="hidden" name="id" value={a.id} />
          <ConfirmButton message="Xoá thông báo này?" className="btn btn-outline text-rose-600"><Trash2 className="h-4 w-4" /> Xoá thông báo</ConfirmButton>
        </form>
      )}
    </>
  );
}
