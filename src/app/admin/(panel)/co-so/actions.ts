"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { canEditVillage, requireAdmin, requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { parseCoords } from "@/lib/geo";
import { parsePhones, slugify } from "@/lib/text";
import { placeSearchText } from "@/lib/search-text";
import { saveUploads } from "@/lib/uploads";

export type FormState = { error?: string } | null;

async function uniqueSlug(base: string, exceptId?: string) {
  let slug = slugify(base) || "co-so";
  for (let i = 2; ; i++) {
    const hit = await db.query.places.findFirst({
      where: exceptId ? and(eq(s.places.slug, slug), ne(s.places.id, exceptId)) : eq(s.places.slug, slug),
      columns: { id: true },
    });
    if (!hit) return slug;
    slug = `${slugify(base)}-${i}`;
  }
}

function str(form: FormData, key: string) {
  const v = String(form.get(key) ?? "").trim();
  return v || null;
}

export async function savePlace(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = str(form, "id");
  const name = str(form, "name");
  const sectorId = str(form, "sectorId");
  if (!name || !sectorId) return { error: "Tên cơ sở và lĩnh vực là bắt buộc." };
  let villageId = Number(form.get("villageId")) || null;
  if (user.role === "VILLAGE") villageId = user.villageId;

  const before = id ? await db.query.places.findFirst({ where: eq(s.places.id, id) }) : null;
  if (id && !before) return { error: "Không tìm thấy cơ sở." };
  if (before && !canEditVillage(user, before.villageId)) return { error: "Bạn chỉ được sửa cơ sở thuộc tổ dân phố của mình." };

  let lat = form.get("lat") ? Number(form.get("lat")) : null;
  let lng = form.get("lng") ? Number(form.get("lng")) : null;
  const locationUrl = str(form, "locationUrl");
  if ((lat == null || lng == null) && locationUrl) {
    const c = parseCoords(locationUrl);
    if (c) ({ lat, lng } = c);
  }
  if (lat != null && (Number.isNaN(lat) || Math.abs(lat) > 90)) return { error: "Vĩ độ không hợp lệ." };
  if (lng != null && (Number.isNaN(lng) || Math.abs(lng) > 180)) return { error: "Kinh độ không hợp lệ." };

  // Ảnh: giữ ảnh cũ không bị đánh dấu xoá + ảnh mới tải lên + link ảnh nhập tay
  const keep = form.getAll("keepImage").map(String);
  let uploaded: string[] = [];
  try {
    uploaded = await saveUploads(form.getAll("newImages") as File[]);
  } catch (e) {
    return { error: (e as Error).message };
  }
  const extraUrls = String(form.get("imageUrls") ?? "")
    .split(/\n/)
    .map((x) => x.trim())
    .filter((x) => /^https?:\/\//.test(x));
  const images = [...keep, ...uploaded, ...extraUrls].slice(0, 10);

  const phones = parsePhones(String(form.get("phones") ?? ""));
  const verified = form.get("verified") === "on";
  const [sector, village] = await Promise.all([
    db.query.sectors.findFirst({ where: eq(s.sectors.id, sectorId) }),
    villageId ? db.query.villages.findFirst({ where: eq(s.villages.id, villageId) }) : null,
  ]);
  if (!sector) return { error: "Lĩnh vực không tồn tại." };

  const values = {
    name,
    sectorId,
    villageId,
    phones,
    openingHours: str(form, "openingHours"),
    address: str(form, "address"),
    lat,
    lng,
    locationUrl,
    description: str(form, "description"),
    website: str(form, "website"),
    images,
    verified,
    verifiedAt: verified ? (before?.verified ? before.verifiedAt : new Date()) : null,
    status: (["ACTIVE", "INACTIVE", "HIDDEN"].includes(String(form.get("status"))) ? form.get("status") : "ACTIVE") as "ACTIVE",
    featured: user.role === "ADMIN" ? form.get("featured") === "on" : before?.featured ?? false,
    searchText: placeSearchText({ name, description: str(form, "description"), address: str(form, "address"), phones, sectorName: sector.name, villageName: village?.name }),
  };

  let savedId = id;
  if (before) {
    // Đổi tên -> giữ slug cũ (không làm chết QR đã in) trừ khi người dùng yêu cầu đổi slug
    let slug = before.slug;
    const newSlug = str(form, "slug");
    if (newSlug && slugify(newSlug) !== before.slug) {
      slug = await uniqueSlug(newSlug, before.id);
      await db.insert(s.slugRedirects).values({ fromSlug: before.slug, placeId: before.id }).onConflictDoNothing();
    }
    await db.update(s.places).set({ ...values, slug }).where(eq(s.places.id, before.id));
    await audit(user, "update", "Place", before.id, `Sửa cơ sở “${name}”`, before, values);
  } else {
    const slug = await uniqueSlug(str(form, "slug") ?? name);
    const [row] = await db.insert(s.places).values({ ...values, slug }).returning({ id: s.places.id });
    savedId = row.id;
    await audit(user, "create", "Place", row.id, `Thêm cơ sở “${name}”`, null, values);
    // Tạo từ đóng góp của người dân -> đánh dấu đã chấp nhận
    const fromSubmission = str(form, "fromSubmission");
    if (fromSubmission) {
      await db
        .update(s.submissions)
        .set({ status: "ACCEPTED", handledAt: new Date(), handledById: user.id, placeId: row.id, handlerNote: "Đã tạo cơ sở" })
        .where(eq(s.submissions.id, fromSubmission));
    }
  }
  revalidatePath("/", "layout");
  redirect(`/admin/co-so/${savedId}?msg=saved`);
}

export async function deletePlace(form: FormData) {
  const user = await requireAdmin();
  const id = String(form.get("id"));
  const before = await db.query.places.findFirst({ where: eq(s.places.id, id) });
  if (!before) redirect("/admin/co-so");
  await db.delete(s.places).where(eq(s.places.id, id));
  await audit(user, "delete", "Place", id, `Xoá cơ sở “${before.name}”`, before, null);
  revalidatePath("/", "layout");
  redirect("/admin/co-so?msg=deleted");
}

export async function toggleVerified(form: FormData) {
  const user = await requireUser();
  const id = String(form.get("id"));
  const p = await db.query.places.findFirst({ where: eq(s.places.id, id) });
  if (!p || !canEditVillage(user, p.villageId)) return;
  const verified = !p.verified;
  await db.update(s.places).set({ verified, verifiedAt: verified ? new Date() : null }).where(eq(s.places.id, id));
  await audit(user, "verify", "Place", id, `${verified ? "Xác minh" : "Bỏ xác minh"} “${p.name}”`);
  revalidatePath("/admin/co-so");
}

/** Giải link rút gọn Google Maps (maps.app.goo.gl) để lấy toạ độ */
export async function resolveMapLink(url: string): Promise<{ lat: number; lng: number } | null> {
  await requireUser();
  const direct = parseCoords(url);
  if (direct) return direct;
  if (!/^https:\/\/(maps\.app\.goo\.gl|goo\.gl|maps\.google\.|www\.google\.)/.test(url)) return null;
  try {
    let cur = url;
    for (let i = 0; i < 5; i++) {
      const res = await fetch(cur, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0" } });
      const loc = res.headers.get("location");
      if (!loc) {
        const html = await res.text();
        return parseCoords(html.slice(0, 200_000));
      }
      cur = new URL(loc, cur).toString();
      const c = parseCoords(decodeURIComponent(cur));
      if (c) return c;
    }
  } catch {}
  return null;
}
