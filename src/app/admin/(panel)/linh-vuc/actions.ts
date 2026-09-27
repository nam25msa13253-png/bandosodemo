"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/text";

export async function saveSector(form: FormData) {
  const user = await requireAdmin();
  const id = String(form.get("id") ?? "");
  const name = String(form.get("name") ?? "").trim();
  if (!name) redirect("/admin/linh-vuc?err=name");
  const values = {
    name,
    icon: String(form.get("icon") || "LayoutGrid"),
    color: String(form.get("color") || "#64748B").toUpperCase(),
    sortOrder: Number(form.get("sortOrder")) || 0,
  };
  if (id) {
    await db.update(s.sectors).set(values).where(eq(s.sectors.id, id));
    await audit(user, "update", "Sector", id, `Sửa lĩnh vực “${name}”`);
  } else {
    const newId = slugify(name).replace(/-/g, "_");
    await db.insert(s.sectors).values({ id: newId, ...values }).onConflictDoNothing();
    await audit(user, "create", "Sector", newId, `Thêm lĩnh vực “${name}”`);
  }
  revalidatePath("/", "layout");
  redirect("/admin/linh-vuc?msg=saved");
}

export async function deleteSector(form: FormData) {
  const user = await requireAdmin();
  const id = String(form.get("id"));
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.places).where(eq(s.places.sectorId, id));
  if (n > 0) redirect("/admin/linh-vuc?err=inuse");
  await db.delete(s.sectors).where(eq(s.sectors.id, id));
  await audit(user, "delete", "Sector", id, `Xoá lĩnh vực ${id}`);
  revalidatePath("/", "layout");
  redirect("/admin/linh-vuc?msg=deleted");
}
