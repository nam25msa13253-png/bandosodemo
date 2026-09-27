"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { canEditVillage, requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { villageSearchText } from "@/lib/search-text";
import { saveUploads } from "@/lib/uploads";

const t = (f: FormData, k: string) => String(f.get(k) ?? "").trim() || null;
const n = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").replace(/[^\d.]/g, "");
  return v ? Number(v) : null;
};

export async function saveVillage(form: FormData) {
  const user = await requireUser();
  const id = Number(form.get("id"));
  const before = await db.query.villages.findFirst({ where: eq(s.villages.id, id) });
  if (!before || !canEditVillage(user, id)) redirect("/admin/to-dan-pho?err=forbidden");

  let polygon = before.polygon;
  if (user.role === "ADMIN") {
    const raw = String(form.get("polygon") ?? "").trim();
    if (!raw) polygon = null;
    else {
      try {
        const p = JSON.parse(raw);
        if (!Array.isArray(p) || p.some((x) => !Array.isArray(x) || x.length !== 2)) throw new Error();
        polygon = p;
      } catch {
        redirect(`/admin/to-dan-pho/${id}?err=polygon`);
      }
    }
  }
  const images = [...form.getAll("keepImage").map(String), ...(await saveUploads(form.getAll("newImages") as File[]))];
  const values = {
    name: user.role === "ADMIN" ? t(form, "name") ?? before.name : before.name,
    mergedFrom: t(form, "mergedFrom"),
    areaHa: n(form, "areaHa"),
    population: n(form, "population"),
    households: n(form, "households"),
    secretaryName: t(form, "secretaryName"),
    secretaryPhone: t(form, "secretaryPhone"),
    leaderName: t(form, "leaderName"),
    leaderPhone: t(form, "leaderPhone"),
    frontHeadName: t(form, "frontHeadName"),
    frontHeadPhone: t(form, "frontHeadPhone"),
    note: t(form, "note"),
    locationUrl: t(form, "locationUrl"),
    images,
    polygon,
  };
  await db.update(s.villages).set({ ...values, searchText: villageSearchText({ ...values, code: before.code }) }).where(eq(s.villages.id, id));
  await audit(user, "update", "Village", id, `Sửa thông tin ${before.name}`, before, values);
  revalidatePath("/", "layout");
  redirect(`/admin/to-dan-pho/${id}?msg=saved`);
}
