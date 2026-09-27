import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { ExternalLink, Printer, Trash2 } from "lucide-react";
import { db, schema as s } from "@/db";
import { canEditVillage, requireUser } from "@/lib/auth";
import { getSectors, getSettings, getVillages } from "@/lib/settings";
import { formatDate } from "@/lib/text";
import { AdminTitle, Flash } from "@/components/admin/ui";
import { PlaceForm } from "@/components/admin/PlaceForm";
import { deletePlace } from "../actions";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

export default async function EditPlace({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const { msg } = await searchParams;
  const p = await db.query.places.findFirst({ where: eq(s.places.id, id) });
  if (!p) notFound();
  if (!canEditVillage(user, p.villageId)) {
    return <p className="card p-6 text-rose-700">Bạn chỉ được sửa cơ sở thuộc tổ dân phố của mình.</p>;
  }
  const [st, sectors, villages, logs] = await Promise.all([
    getSettings(),
    getSectors(),
    getVillages(),
    db.select().from(s.auditLogs).where(and(eq(s.auditLogs.entity, "Place"), eq(s.auditLogs.entityId, id))).orderBy(desc(s.auditLogs.createdAt)).limit(10),
  ]);
  return (
    <>
      <AdminTitle
        title={p.name}
        desc={`Cập nhật lần cuối ${formatDate(p.updatedAt, true)}`}
        actions={
          <>
            <Link href={`/dich-vu/${p.slug}`} target="_blank" className="btn btn-outline"><ExternalLink className="h-4 w-4" /> Xem trang</Link>
            <Link href={`/in-qr/${p.slug}`} target="_blank" className="btn btn-outline"><Printer className="h-4 w-4" /> In tem QR</Link>
            {user.role === "ADMIN" && (
              <form action={deletePlace}>
                <input type="hidden" name="id" value={p.id} />
                <ConfirmButton message={`Xoá vĩnh viễn “${p.name}”? Có thể chuyển sang “Ngừng hoạt động” thay vì xoá.`} className="btn btn-danger">
                  <Trash2 className="h-4 w-4" /> Xoá
                </ConfirmButton>
              </form>
            )}
          </>
        }
      />
      <Flash msg={msg === "saved" ? "Đã lưu thay đổi." : undefined} />
      <PlaceForm
        data={p}
        sectors={sectors}
        villages={villages}
        center={[Number(st.map_center_lat), Number(st.map_center_lng)]}
        isAdmin={user.role === "ADMIN"}
        lockedVillageId={user.role === "VILLAGE" ? user.villageId : undefined}
      />
      {logs.length > 0 && (
        <div className="card mt-4 p-4">
          <p className="font-bold text-slate-800">Lịch sử thay đổi</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {logs.map((l) => (
              <li key={l.id}>{formatDate(l.createdAt, true)} – <b>{l.username ?? "hệ thống"}</b>: {l.summary}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
