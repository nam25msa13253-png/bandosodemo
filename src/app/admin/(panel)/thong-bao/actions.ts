"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { canEditVillage, requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/text";
import { announcementSearchText } from "@/lib/search-text";

function toDate(v: FormDataEntryValue | null) {
  const t = String(v ?? "");
  return t ? new Date(t + ":00+07:00") : null;
}

export async function saveAnnouncement(form: FormData) {
  const user = await requireUser();
  const id = String(form.get("id") ?? "") || null;
  const title = String(form.get("title") ?? "").trim();
  const content = String(form.get("content") ?? "").trim();
  if (!title || !content) redirect(`/admin/thong-bao/${id ?? "moi"}?err=missing`);
  let villageId = Number(form.get("villageId")) || null;
  if (user.role === "VILLAGE") villageId = user.villageId;

  const before = id ? await db.query.announcements.findFirst({ where: eq(s.announcements.id, id) }) : null;
  if (before && !canEditVillage(user, before.villageId)) redirect("/admin/thong-bao?err=forbidden");

  const summary = String(form.get("summary") ?? "").trim() || null;
  const values = {
    title, content, summary, villageId,
    pinned: form.get("pinned") === "on",
    published: form.get("published") === "on",
    publishedAt: toDate(form.get("publishedAt")) ?? new Date(),
    expiresAt: toDate(form.get("expiresAt")),
    searchText: announcementSearchText({ title, summary, content }),
  };
  let savedId = id;
  if (before) {
    await db.update(s.announcements).set(values).where(eq(s.announcements.id, before.id));
    await audit(user, "update", "Announcement", before.id, `Sửa thông báo “${title}”`);
  } else {
    let slug = slugify(title) || "thong-bao";
    for (let i = 2; await db.query.announcements.findFirst({ where: eq(s.announcements.slug, slug) }); i++)
      slug = `${slugify(title)}-${i}`;
    const [row] = await db.insert(s.announcements).values({ ...values, slug, authorId: user.id }).returning({ id: s.announcements.id });
    savedId = row.id;
    await audit(user, "create", "Announcement", row.id, `Đăng thông báo “${title}”`);
  }
  revalidatePath("/", "layout");
  redirect(`/admin/thong-bao/${savedId}?msg=saved`);
}

export async function deleteAnnouncement(form: FormData) {
  const user = await requireUser();
  const id = String(form.get("id"));
  const a = await db.query.announcements.findFirst({ where: eq(s.announcements.id, id) });
  if (!a || !canEditVillage(user, a.villageId)) redirect("/admin/thong-bao?err=forbidden");
  await db.delete(s.announcements).where(eq(s.announcements.id, id));
  await audit(user, "delete", "Announcement", id, `Xoá thông báo “${a.title}”`);
  revalidatePath("/", "layout");
  redirect("/admin/thong-bao?msg=deleted");
}
