"use server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireAdmin, requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

const strong = (p: string) => p.length >= 8 && /\d/.test(p) && /[A-Za-z]/.test(p);

export async function createUser(form: FormData) {
  const admin = await requireAdmin();
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const fullName = String(form.get("fullName") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const role = form.get("role") === "ADMIN" ? "ADMIN" : "VILLAGE";
  const villageId = Number(form.get("villageId")) || null;
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) redirect("/admin/tai-khoan?err=username");
  if (!fullName || !strong(password)) redirect("/admin/tai-khoan?err=password");
  if (role === "VILLAGE" && !villageId) redirect("/admin/tai-khoan?err=village");
  const exists = await db.query.users.findFirst({ where: eq(s.users.username, username) });
  if (exists) redirect("/admin/tai-khoan?err=exists");
  const [u] = await db
    .insert(s.users)
    .values({ username, fullName, role, villageId: role === "VILLAGE" ? villageId : null, passwordHash: await bcrypt.hash(password, 10) })
    .returning({ id: s.users.id });
  await audit(admin, "create", "User", u.id, `Tạo tài khoản ${username}`);
  revalidatePath("/admin/tai-khoan");
  redirect("/admin/tai-khoan?msg=created");
}

export async function updateUser(form: FormData) {
  const admin = await requireAdmin();
  const id = String(form.get("id"));
  const op = String(form.get("op"));
  if (id === admin.id && op === "toggle") redirect("/admin/tai-khoan?err=self");
  const u = await db.query.users.findFirst({ where: eq(s.users.id, id) });
  if (!u) redirect("/admin/tai-khoan");
  if (op === "toggle") {
    await db.update(s.users).set({ active: !u.active }).where(eq(s.users.id, id));
    await audit(admin, "update", "User", id, `${u.active ? "Khoá" : "Mở khoá"} tài khoản ${u.username}`);
  } else if (op === "reset") {
    const password = String(form.get("password") ?? "");
    if (!strong(password)) redirect("/admin/tai-khoan?err=password");
    await db.update(s.users).set({ passwordHash: await bcrypt.hash(password, 10), failedLogins: 0, lockedUntil: null }).where(eq(s.users.id, id));
    await audit(admin, "update", "User", id, `Đặt lại mật khẩu ${u.username}`);
  }
  revalidatePath("/admin/tai-khoan");
  redirect("/admin/tai-khoan?msg=saved");
}

export async function changeOwnPassword(form: FormData) {
  const me = await requireUser();
  const u = await db.query.users.findFirst({ where: eq(s.users.id, me.id) });
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (!u || !(await bcrypt.compare(current, u.passwordHash))) redirect("/admin/tai-khoan?err=current");
  if (!strong(next)) redirect("/admin/tai-khoan?err=password");
  await db.update(s.users).set({ passwordHash: await bcrypt.hash(next, 10) }).where(eq(s.users.id, me.id));
  await audit(me, "update", "User", me.id, "Đổi mật khẩu");
  redirect("/admin/tai-khoan?msg=pw");
}
