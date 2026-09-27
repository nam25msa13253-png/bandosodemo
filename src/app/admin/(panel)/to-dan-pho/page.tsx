import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getVillages } from "@/lib/settings";
import { villageCounts } from "@/lib/queries";
import { formatNumber } from "@/lib/text";
import { AdminTitle, Flash } from "@/components/admin/ui";

export default async function AdminVillages({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const user = await requireUser();
  const { err } = await searchParams;
  const [villages, counts] = await Promise.all([getVillages(), villageCounts()]);
  return (
    <>
      <AdminTitle title="Tổ dân phố" desc="Thông tin tổ, cán bộ, ranh giới trên bản đồ hành chính" />
      <Flash err={err === "forbidden" ? "Bạn chỉ được sửa tổ dân phố của mình." : undefined} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2.5">Tổ</th><th className="px-3 py-2.5">Tổ trưởng</th><th className="px-3 py-2.5">Bí thư</th>
              <th className="px-3 py-2.5 text-right">Nhân khẩu</th><th className="px-3 py-2.5 text-right">Hộ</th>
              <th className="px-3 py-2.5 text-right">Cơ sở</th><th className="px-3 py-2.5">Ranh giới</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {villages.map((v) => {
              const can = user.role === "ADMIN" || user.villageId === v.id;
              return (
                <tr key={v.id}>
                  <td className="px-3 py-2 font-semibold">{can ? <Link href={`/admin/to-dan-pho/${v.id}`} className="text-navy-700 hover:underline">{v.name}</Link> : v.name}</td>
                  <td className="px-3 py-2">{v.leaderName ?? "—"}</td>
                  <td className="px-3 py-2">{v.secretaryName ?? "—"}</td>
                  <td className="px-3 py-2 text-right">{formatNumber(v.population)}</td>
                  <td className="px-3 py-2 text-right">{formatNumber(v.households)}</td>
                  <td className="px-3 py-2 text-right">{counts[v.id] ?? 0}</td>
                  <td className="px-3 py-2">{v.polygon?.length ? `✓ ${v.polygon.length} điểm` : <span className="text-rose-500">Chưa có</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
