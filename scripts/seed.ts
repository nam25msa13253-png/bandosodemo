/**
 * Nạp dữ liệu ban đầu vào CSDL từ data/seed-data.json
 * Chạy: npm run db:seed
 *  - CSDL trống: nạp toàn bộ dữ liệu.
 *  - CSDL đã có dữ liệu: bỏ qua, KHÔNG ghi đè những gì đã sửa trong trang quản trị.
 *  - Muốn nạp đè lại từ file JSON: npm run db:seed -- --force
 */
import "./load-env";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { eq, sql } from "drizzle-orm";
import { db, schema as s } from "../src/db";
import { placeSearchText, villageSearchText, announcementSearchText } from "../src/lib/search-text";

type SeedData = {
  sectors: (typeof s.sectors.$inferInsert)[];
  villages: (Omit<typeof s.villages.$inferInsert, "id"> & { code: number })[];
  places: (Omit<typeof s.places.$inferInsert, "villageId"> & { villageCode: number | null })[];
  agencies: (typeof s.agencies.$inferInsert)[];
  emergency: (typeof s.emergencyContacts.$inferInsert)[];
  settings: Record<string, string>;
};

async function main() {
  const data: SeedData = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data", "seed-data.json"), "utf8"),
  );

  const force = process.argv.includes("--force");
  const [{ n: placeCount }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.places);
  const loadCore = force || placeCount === 0;
  if (!loadCore) console.log(`→ CSDL đã có ${placeCount} cơ sở – bỏ qua nạp dữ liệu (dùng --force để nạp đè).`);

  if (loadCore) {
  console.log("→ Lĩnh vực:", data.sectors.length);
  for (const x of data.sectors) {
    await db.insert(s.sectors).values(x).onConflictDoUpdate({ target: s.sectors.id, set: x });
  }

  console.log("→ Tổ dân phố:", data.villages.length);
  const vid = new Map<number, number>();
  const vname = new Map<number, string>();
  for (const v0 of data.villages) {
    const v = { ...v0, searchText: villageSearchText(v0) };
    vname.set(v.code, v.name);
    const [row] = await db
      .insert(s.villages)
      .values(v)
      .onConflictDoUpdate({ target: s.villages.code, set: v })
      .returning({ id: s.villages.id });
    vid.set(v.code, row.id);
  }

  console.log("→ Cơ sở dịch vụ:", data.places.length);
  for (const p of data.places) {
    const { villageCode, ...rest } = p;
    const values = {
      ...rest,
      villageId: villageCode ? vid.get(villageCode) ?? null : null,
      searchText: placeSearchText({
        ...rest,
        sectorName: data.sectors.find((x) => x.id === rest.sectorId)?.name,
        villageName: villageCode ? vname.get(villageCode) : null,
      }),
    };
    await db.insert(s.places).values(values).onConflictDoUpdate({ target: s.places.slug, set: values });
  }

  }

  const [{ n: agencyCount }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.agencies);
  if (agencyCount === 0) await db.insert(s.agencies).values(data.agencies);
  const [{ n: emCount }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.emergencyContacts);
  if (emCount === 0) await db.insert(s.emergencyContacts).values(data.emergency);

  console.log("→ Cấu hình");
  for (const [key, value] of Object.entries(data.settings)) {
    // không ghi đè cấu hình đã sửa trong trang quản trị
    await db.insert(s.settings).values({ key, value }).onConflictDoNothing();
  }

  const [{ n: annCount }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.announcements);
  if (annCount === 0) {
    const ann = {
      slug: "ra-mat-he-thong-ban-do-so",
      title: "Ra mắt hệ thống Bản đồ số – Tra cứu tiện ích",
      summary:
        "Người dân có thể tra cứu cơ sở dịch vụ, tổ dân phố và thông báo của phường ngay trên điện thoại.",
      content:
        "Hệ thống Bản đồ số giúp người dân và du khách tìm kiếm nhanh các cơ sở dịch vụ, cơ quan, trường học, y tế trên địa bàn phường; xem thông tin tổ dân phố và liên hệ cán bộ tổ.\n\nNếu phát hiện thông tin chưa chính xác, bà con vui lòng bấm nút \"Báo sai thông tin\" tại trang chi tiết của cơ sở, hoặc gửi đề xuất cơ sở mới tại mục \"Đề xuất\".\n\n(Đây là thông báo mẫu – quản trị viên có thể sửa hoặc xóa trong trang quản trị.)",
      pinned: true,
    };
    await db.insert(s.announcements).values({ ...ann, searchText: announcementSearchText(ann) });
  }

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "Admin@123456";
  const existing = await db.query.users.findFirst({ where: eq(s.users.username, username) });
  if (!existing) {
    await db.insert(s.users).values({
      username,
      fullName: "Quản trị phường",
      role: "ADMIN",
      passwordHash: await bcrypt.hash(password, 10),
    });
    console.log(
      process.env.ADMIN_PASSWORD
        ? `→ Tạo tài khoản quản trị: ${username} (mật khẩu = biến môi trường ADMIN_PASSWORD)`
        : `→ Tạo tài khoản quản trị: ${username} / ${password}  (đổi mật khẩu sau khi đăng nhập)`,
    );
  }
  console.log("✔ Hoàn tất");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
