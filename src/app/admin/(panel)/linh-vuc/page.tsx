import { Plus, Save, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getSectors } from "@/lib/settings";
import { sectorCounts } from "@/lib/queries";
import { AdminTitle, Flash } from "@/components/admin/ui";
import { SECTOR_ICONS, SectorIcon } from "@/components/SectorIcon";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { deleteSector, saveSector } from "./actions";

const ICONS = Object.keys(SECTOR_ICONS);

export default async function AdminSectors({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  await requireAdmin();
  const { msg, err } = await searchParams;
  const [sectors, counts] = await Promise.all([getSectors(), sectorCounts()]);
  const Row = ({ s }: { s?: (typeof sectors)[number] }) => (
    <form action={saveSector} className="grid items-center gap-2 p-3 sm:grid-cols-[40px_1fr_150px_90px_70px_auto]">
      {s && <input type="hidden" name="id" value={s.id} />}
      <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: (s?.color ?? "#64748B") + "22" }}>
        <SectorIcon name={s?.icon ?? "LayoutGrid"} className="h-5 w-5" style={{ color: s?.color }} />
      </span>
      <div>
        <input name="name" defaultValue={s?.name} placeholder="Tên lĩnh vực mới" required className="input" />
        {s && <p className="mt-0.5 text-[11px] text-slate-400">{s.id} · {counts[s.id] ?? 0} cơ sở</p>}
      </div>
      <select name="icon" defaultValue={s?.icon ?? "LayoutGrid"} className="input">
        {ICONS.map((i) => <option key={i}>{i}</option>)}
      </select>
      <input type="color" name="color" defaultValue={s?.color ?? "#64748B"} className="h-10 w-full rounded-xl border border-slate-300" />
      <input name="sortOrder" type="number" defaultValue={s?.sortOrder ?? sectors.length + 1} className="input" title="Thứ tự" />
      <div className="flex gap-1">
        <button className="btn btn-primary px-3" title="Lưu">{s ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</button>
      </div>
    </form>
  );
  return (
    <>
      <AdminTitle title="Lĩnh vực" desc="Tên, biểu tượng, màu hiển thị trên bản đồ và thứ tự" />
      <Flash
        msg={msg === "saved" ? "Đã lưu." : msg === "deleted" ? "Đã xoá." : undefined}
        err={err === "inuse" ? "Không xoá được: lĩnh vực đang có cơ sở. Hãy chuyển cơ sở sang lĩnh vực khác trước." : undefined}
      />
      <div className="card divide-y divide-slate-100">
        {sectors.map((s) => (
          <div key={s.id} className="flex items-center">
            <div className="flex-1"><Row s={s} /></div>
            {(counts[s.id] ?? 0) === 0 && (
              <form action={deleteSector} className="pr-3">
                <input type="hidden" name="id" value={s.id} />
                <ConfirmButton message={`Xoá lĩnh vực “${s.name}”?`} className="btn btn-outline px-3 text-rose-600"><Trash2 className="h-4 w-4" /></ConfirmButton>
              </form>
            )}
          </div>
        ))}
        <div className="bg-slate-50"><Row /></div>
      </div>
    </>
  );
}
