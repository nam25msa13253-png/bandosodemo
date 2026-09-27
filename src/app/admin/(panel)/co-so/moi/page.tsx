import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireUser } from "@/lib/auth";
import { getSectors, getSettings, getVillages } from "@/lib/settings";
import { AdminTitle } from "@/components/admin/ui";
import { PlaceForm, type PlaceFormData } from "@/components/admin/PlaceForm";

export default async function NewPlace({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const user = await requireUser();
  const { from } = await searchParams;
  const [st, sectors, villages] = await Promise.all([getSettings(), getSectors(), getVillages()]);
  let data: PlaceFormData = {};
  // Tạo nhanh từ đề xuất của người dân
  if (from) {
    const sub = await db.query.submissions.findFirst({ where: eq(s.submissions.id, from) });
    if (sub) {
      data = {
        name: sub.name ?? "", sectorId: sub.sectorId ?? undefined, phones: sub.phone ? [sub.phone] : [],
        address: sub.address, lat: sub.lat, lng: sub.lng, description: sub.content, fromSubmission: sub.id,
      };
    }
  }
  return (
    <>
      <AdminTitle title="Thêm cơ sở mới" desc={from ? "Tạo từ đề xuất của người dân – kiểm tra kỹ trước khi lưu" : undefined} />
      <PlaceForm
        data={data}
        sectors={sectors}
        villages={villages}
        center={[Number(st.map_center_lat), Number(st.map_center_lng)]}
        isAdmin={user.role === "ADMIN"}
        lockedVillageId={user.role === "VILLAGE" ? user.villageId : undefined}
      />
    </>
  );
}
