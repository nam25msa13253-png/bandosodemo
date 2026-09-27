"use server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { SESSION_COOKIE, signSession } from "@/lib/session";
import { audit } from "@/lib/audit";
import { siteUrl } from "@/lib/settings";

export async function login(_prev: string | null, form: FormData): Promise<string | null> {
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/admin");
  if (!username || !password) return "Vui lòng nhập tên đăng nhập và mật khẩu.";

  const user = await db.query.users.findFirst({ where: eq(s.users.username, username) });
  if (!user || !user.active) return "Sai tên đăng nhập hoặc mật khẩu.";
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return `Tài khoản tạm khoá do nhập sai nhiều lần. Thử lại sau ${mins} phút.`;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const fails = user.failedLogins + 1;
    await db
      .update(s.users)
      .set({ failedLogins: fails >= 5 ? 0 : fails, lockedUntil: fails >= 5 ? new Date(Date.now() + 15 * 60000) : null })
      .where(eq(s.users.id, user.id));
    return fails >= 5 ? "Nhập sai 5 lần – tài khoản bị khoá 15 phút." : "Sai tên đăng nhập hoặc mật khẩu.";
  }
  await db.update(s.users).set({ failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(s.users.id, user.id));
  const sessionUser = { id: user.id, username: user.username, fullName: user.fullName, role: user.role, villageId: user.villageId };
  const token = await signSession(sessionUser);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && siteUrl().startsWith("https"),
    path: "/",
    maxAge: 12 * 3600,
  });
  await audit(sessionUser, "login", "User", user.id, "Đăng nhập");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}
