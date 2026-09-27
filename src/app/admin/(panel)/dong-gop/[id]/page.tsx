import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Check, Pencil, Plus, X } from "lucide-react";
import { db, schema as s } from "@/db";
import { requireUser } from "@/lib/auth";
import { formatDate, formatPhone } from "@/lib/text";
import { AdminTitle } from "@/components/admin/ui";
import { SUB_STATUS, SUB_TYPES } from "../labels";
import { handleSubmission } from "../actions";

export default async function SubmissionDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const sub = await db.query.submissions.findFirst({ where: eq(s.submissions.id, id), with: { place: true } });
  if (!sub) notFound();
  const place = sub.place;
  return (
    <>
      <AdminTitle title={`Đóng góp: ${SUB_TYPES[sub.type]}`} desc={`Gửi lúc ${formatDate(sub.createdAt, true)} · ${SUB_STATUS[sub.status]}`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card space-y-2 p-4 text-sm">
          <p className="font-bold text-slate-800">Nội dung người dân gửi</p>
          {sub.name && <p><b>Tên cơ sở:</b> {sub.name}</p>}
          {sub.phone && <p><b>SĐT cơ sở:</b> {sub.phone}</p>}
          {sub.address && <p><b>Địa chỉ:</b> {sub.address}</p>}
          <p className="whitespace-pre-line rounded-xl bg-slate-50 p-3">{sub.content}</p>
          {sub.lat != null && (
            <p>
              <b>Vị trí đánh dấu:</b>{" "}
              <a className="text-navy-700 underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${sub.lat},${sub.lng}`}>
                {sub.lat}, {sub.lng}
              </a>
            </p>
          )}
          <p className="border-t border-slate-100 pt-2 text-slate-500">
            Người gửi: {sub.contactName ?? "Ẩn danh"} {sub.contactPhone && <>· <a href={`tel:${sub.contactPhone}`} className="font-semibold text-emerald-700">{formatPhone(sub.contactPhone)}</a></>}
          </p>
        </div>
        <div className="space-y-4">
          {place && (
            <div className="card space-y-1 p-4 text-sm">
              <p className="font-bold text-slate-800">Thông tin hiện tại của cơ sở</p>
              <p><b>{place.name}</b></p>
              <p>SĐT: {place.phones.join(", ") || "—"}</p>
              <p>Giờ: {place.openingHours ?? "—"}</p>
              <p>Toạ độ: {place.lat != null ? `${place.lat}, ${place.lng}` : "—"}</p>
              <p>Trạng thái: {place.status}</p>
              <Link href={`/admin/co-so/${place.id}`} className="btn btn-outline mt-2"><Pencil className="h-4 w-4" /> Sửa cơ sở này</Link>
            </div>
          )}
          {sub.status === "PENDING" ? (
            <div className="card space-y-3 p-4">
              <p className="font-bold text-slate-800">Xử lý</p>
              {sub.type === "NEW_PLACE" && (
                <Link href={`/admin/co-so/moi?from=${sub.id}`} className="btn btn-green w-full">
                  <Plus className="h-4 w-4" /> Tạo cơ sở từ đề xuất này (tự đánh dấu đã chấp nhận)
                </Link>
              )}
              <form action={handleSubmission} className="space-y-2">
                <input type="hidden" name="id" value={sub.id} />
                <textarea name="note" rows={2} placeholder="Ghi chú xử lý (không bắt buộc)" className="input" />
                <div className="grid grid-cols-2 gap-2">
                  <button name="decision" value="accept" className="btn btn-primary"><Check className="h-4 w-4" /> Đã cập nhật / Chấp nhận</button>
                  <button name="decision" value="reject" className="btn btn-outline text-rose-600"><X className="h-4 w-4" /> Từ chối</button>
                </div>
              </form>
              <p className="text-xs text-slate-500">Với báo sai: bấm “Sửa cơ sở này”, cập nhật, rồi quay lại bấm “Chấp nhận”.</p>
            </div>
          ) : (
            <div className="card p-4 text-sm">
              <p><b>{SUB_STATUS[sub.status]}</b> lúc {formatDate(sub.handledAt, true)}</p>
              {sub.handlerNote && <p className="mt-1 text-slate-600">Ghi chú: {sub.handlerNote}</p>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
