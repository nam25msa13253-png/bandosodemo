import { and, asc, eq, type SQL } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { getSession } from "@/lib/auth";

/** Xuất danh sách cơ sở ra CSV (mở được bằng Excel, giữ tiếng Việt) */
export async function GET(req: Request) {
  const user = await getSession();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const sp = new URL(req.url).searchParams;
  const where: SQL[] = [];
  if (user.role === "VILLAGE") where.push(eq(s.places.villageId, user.villageId ?? -1));
  else if (sp.get("village")) where.push(eq(s.places.villageId, Number(sp.get("village"))));
  if (sp.get("sector")) where.push(eq(s.places.sectorId, sp.get("sector")!));

  const rows = await db
    .select({
      slug: s.places.slug, name: s.places.name, sector: s.sectors.name, village: s.villages.name, phones: s.places.phones,
      hours: s.places.openingHours, address: s.places.address, lat: s.places.lat, lng: s.places.lng,
      locationUrl: s.places.locationUrl, description: s.places.description, website: s.places.website,
      verified: s.places.verified, status: s.places.status, views: s.places.viewCount, updatedAt: s.places.updatedAt,
    })
    .from(s.places)
    .innerJoin(s.sectors, eq(s.sectors.id, s.places.sectorId))
    .leftJoin(s.villages, eq(s.villages.id, s.places.villageId))
    .where(and(...where))
    .orderBy(asc(s.places.name));

  const head = ["Slug", "Tên cơ sở", "Lĩnh vực", "Tổ dân phố", "SĐT", "Giờ hoạt động", "Địa chỉ", "Vĩ độ", "Kinh độ", "Link vị trí", "Mô tả", "Website", "Đã xác minh", "Trạng thái", "Lượt xem", "Cập nhật"];
  const esc = (v: unknown) => {
    const t = v == null ? "" : String(v);
    return /[",\n;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const lines = [head.join(",")].concat(
    rows.map((r) =>
      [r.slug, r.name, r.sector, r.village, r.phones.join(" / "), r.hours, r.address, r.lat, r.lng, r.locationUrl, r.description, r.website,
        r.verified ? "Có" : "Không", r.status, r.views, r.updatedAt.toISOString()].map(esc).join(","),
    ),
  );
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="co-so-dich-vu-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
