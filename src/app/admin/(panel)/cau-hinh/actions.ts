"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { saveUpload } from "@/lib/uploads";

const SETTING_KEYS = [
  "site_name", "site_short", "site_tagline", "meta_title", "meta_description", "logo_url", "banner_url", "admin_map_url",
  "search_placeholder", "unit_name", "map_center_lat", "map_center_lng", "map_zoom", "weather_place",
  "contact_zalo", "contact_hotline", "contact_email", "contact_address", "about",
] as const;

export async function saveSettings(form: FormData) {
  const user = await requireAdmin();
  const values: Record<string, string> = {};
  for (const k of SETTING_KEYS) values[k] = String(form.get(k) ?? "").trim();
  values.allow_submissions = form.get("allow_submissions") === "on" ? "true" : "false";
  values.show_official_phones = form.get("show_official_phones") === "on" ? "true" : "false";
  // Ảnh tải lên thay cho link
  for (const k of ["logo_url", "banner_url", "admin_map_url"]) {
    const f = form.get(`${k}_file`) as File | null;
    if (f && f.size > 0) {
      try {
        values[k] = await saveUpload(f);
      } catch (e) {
        redirect(`/admin/cau-hinh?err=${encodeURIComponent((e as Error).message)}`);
      }
    }
  }
  for (const [key, value] of Object.entries(values)) {
    await db.insert(s.settings).values({ key, value }).onConflictDoUpdate({ target: s.settings.key, set: { value } });
  }
  await audit(user, "update", "Setting", null, "Cập nhật cấu hình trang");
  revalidatePath("/", "layout");
  redirect("/admin/cau-hinh?msg=saved");
}

export async function saveEmergency(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id")) || null;
  const v = {
    name: String(form.get("name") ?? "").trim(),
    phone: String(form.get("phone") ?? "").trim(),
    color: String(form.get("color") ?? "") || null,
    sortOrder: Number(form.get("sortOrder")) || 0,
  };
  if (form.get("delete") === "1" && id) await db.delete(s.emergencyContacts).where(eq(s.emergencyContacts.id, id));
  else if (v.name && v.phone) {
    if (id) await db.update(s.emergencyContacts).set(v).where(eq(s.emergencyContacts.id, id));
    else await db.insert(s.emergencyContacts).values(v);
  }
  revalidatePath("/", "layout");
  redirect("/admin/cau-hinh?msg=saved#khan-cap");
}

export async function saveAgency(form: FormData) {
  await requireAdmin();
  const id = Number(form.get("id")) || null;
  const v = {
    name: String(form.get("name") ?? "").trim(),
    logo: String(form.get("logo") ?? "").trim() || null,
    locationUrl: String(form.get("locationUrl") ?? "").trim() || null,
    phone: String(form.get("phone") ?? "").trim() || null,
    sortOrder: Number(form.get("sortOrder")) || 0,
  };
  const f = form.get("logoFile") as File | null;
  if (f && f.size > 0) v.logo = await saveUpload(f);
  if (form.get("delete") === "1" && id) await db.delete(s.agencies).where(eq(s.agencies.id, id));
  else if (v.name) {
    if (id) await db.update(s.agencies).set(v).where(eq(s.agencies.id, id));
    else await db.insert(s.agencies).values(v);
  }
  revalidatePath("/", "layout");
  redirect("/admin/cau-hinh?msg=saved#co-quan");
}
