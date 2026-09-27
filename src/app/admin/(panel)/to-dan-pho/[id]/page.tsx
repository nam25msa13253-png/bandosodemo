import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Save } from "lucide-react";
import { db, schema as s } from "@/db";
import { canEditVillage, requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { AdminTitle, Flash } from "@/components/admin/ui";
import { PolygonEditor } from "@/components/admin/PolygonEditor";
import { saveVillage } from "../actions";

export default async function EditVillage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string; err?: string }> }) {
  const user = await requireUser();
  const id = Number((await params).id);
  const { msg, err } = await searchParams;
  const v = await db.query.villages.findFirst({ where: eq(s.villages.id, id) });
  if (!v) notFound();
  if (!canEditVillage(user, id)) return <p className="card p-6 text-rose-700">Bạn chỉ được sửa tổ dân phố của mình.</p>;
  const st = await getSettings();
  const F = ({ name, label, value, type = "text" }: { name: string; label: string; value: string | number | null | undefined; type?: string }) => (
    <div>
      <label className="label">{label}</label>
      <input name={name} type={type} defaultValue={value ?? ""} className="input" />
    </div>
  );
  return (
    <>
      <AdminTitle title={v.name} />
      <Flash msg={msg === "saved" ? "Đã lưu." : undefined} err={err === "polygon" ? "Dữ liệu ranh giới không hợp lệ." : undefined} />
      <form action={saveVillage} className="grid gap-4 xl:grid-cols-2">
        <input type="hidden" name="id" value={v.id} />
        <div className="card space-y-3 p-4">
          <p className="font-bold text-slate-800">Thông tin chung</p>
          {user.role === "ADMIN" && <F name="name" label="Tên tổ" value={v.name} />}
          <div>
            <label className="label">Sáp nhập từ</label>
            <textarea name="mergedFrom" rows={3} defaultValue={v.mergedFrom ?? ""} className="input" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <F name="population" label="Nhân khẩu" value={v.population} />
            <F name="households" label="Số hộ" value={v.households} />
            <F name="areaHa" label="Diện tích (ha)" value={v.areaHa} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <F name="secretaryName" label="Bí thư chi bộ" value={v.secretaryName} />
            <F name="secretaryPhone" label="SĐT Bí thư" value={v.secretaryPhone} />
            <F name="leaderName" label="Tổ trưởng" value={v.leaderName} />
            <F name="leaderPhone" label="SĐT Tổ trưởng" value={v.leaderPhone} />
            <F name="frontHeadName" label="Trưởng ban CTMT" value={v.frontHeadName} />
            <F name="frontHeadPhone" label="SĐT Trưởng ban CTMT" value={v.frontHeadPhone} />
          </div>
          <F name="locationUrl" label="Link vị trí (nhà văn hoá...)" value={v.locationUrl} />
          <div>
            <label className="label">Ghi chú</label>
            <textarea name="note" rows={2} defaultValue={v.note ?? ""} className="input" />
          </div>
          {v.images.map((img) => <input key={img} type="hidden" name="keepImage" value={img} />)}
          <div>
            <label className="label">Thêm ảnh</label>
            <input type="file" name="newImages" multiple accept="image/*" className="text-sm" />
          </div>
        </div>
        <div className="space-y-4">
          {user.role === "ADMIN" && (
            <div className="card p-4">
              <p className="font-bold text-slate-800">Ranh giới trên bản đồ hành chính</p>
              <p className="mb-3 text-xs text-slate-500">Chạm lần lượt các điểm theo đường biên của tổ trên ảnh. Toạ độ lưu theo % của ảnh (giống web gốc).</p>
              <PolygonEditor image={st.admin_map_url} initial={v.polygon ?? []} />
            </div>
          )}
          <button className="btn btn-primary h-12 w-full"><Save className="h-5 w-5" /> Lưu</button>
        </div>
      </form>
    </>
  );
}
