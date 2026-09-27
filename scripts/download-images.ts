/**
 * Tải toàn bộ ảnh đang trỏ ra máy chủ ngoài (VD: hahuytapso.vn) về thư mục ./uploads
 * rồi đổi đường dẫn trong CSDL sang ảnh nội bộ. Nên chạy 1 lần sau khi nạp dữ liệu.
 *   npm run images:download
 */
import "./load-env";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema as s } from "../src/db";

const DIR = path.join(process.cwd(), "uploads", "remote");
const cache = new Map<string, string>();
let ok = 0, fail = 0;

async function localize(url: string | null): Promise<string | null> {
  if (!url || !/^https?:\/\//.test(url)) return url;
  if (cache.has(url)) return cache.get(url)!;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(String(res.status));
    const type = res.headers.get("content-type") ?? "";
    const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : type.includes("gif") ? "gif" : "jpg";
    const name = crypto.createHash("sha1").update(url).digest("hex").slice(0, 20) + "." + ext;
    await fs.writeFile(path.join(DIR, name), Buffer.from(await res.arrayBuffer()));
    const local = `/api/files/remote/${name}`;
    cache.set(url, local);
    ok++;
    return local;
  } catch (e) {
    fail++;
    console.warn("  ✗", url, (e as Error).message);
    return url;
  }
}

async function main() {
  await fs.mkdir(DIR, { recursive: true });
  const places = await db.select({ id: s.places.id, images: s.places.images }).from(s.places);
  console.log(`→ Ảnh cơ sở (${places.length} cơ sở)...`);
  for (let i = 0; i < places.length; i += 5) {
    await Promise.all(
      places.slice(i, i + 5).map(async (p) => {
        const imgs = await Promise.all(p.images.map((u) => localize(u)));
        if (imgs.join() !== p.images.join()) await db.update(s.places).set({ images: imgs as string[] }).where(eq(s.places.id, p.id));
      }),
    );
    process.stdout.write(`\r  ${Math.min(i + 5, places.length)}/${places.length}`);
  }
  console.log("\n→ Ảnh tổ dân phố, cơ quan, cấu hình...");
  for (const v of await db.select().from(s.villages)) {
    const imgs = await Promise.all(v.images.map((u) => localize(u)));
    await db.update(s.villages).set({ images: imgs as string[] }).where(eq(s.villages.id, v.id));
  }
  for (const a of await db.select().from(s.agencies)) {
    await db.update(s.agencies).set({ logo: await localize(a.logo) }).where(eq(s.agencies.id, a.id));
  }
  for (const key of ["logo_url", "banner_url", "admin_map_url"]) {
    const row = await db.query.settings.findFirst({ where: eq(s.settings.key, key) });
    if (row) await db.update(s.settings).set({ value: (await localize(row.value)) ?? "" }).where(eq(s.settings.key, key));
  }
  console.log(`✔ Xong: tải được ${ok} ảnh, lỗi ${fail} ảnh (ảnh lỗi giữ nguyên link cũ).`);
  process.exit(0);
}
main();
