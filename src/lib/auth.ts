import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { SESSION_COOKIE, verifySession, type SessionUser } from "./session";

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const u = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!u) return null;
  // kiểm tra tài khoản còn hoạt động
  const row = await db.query.users.findFirst({ where: eq(s.users.id, u.id) });
  if (!row || !row.active) return null;
  return { id: row.id, username: row.username, fullName: row.fullName, role: row.role, villageId: row.villageId };
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getSession();
  if (!u) redirect("/admin/login");
  return u;
}

export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role !== "ADMIN") redirect("/admin?err=forbidden");
  return u;
}

/** Cán bộ tổ chỉ được thao tác dữ liệu thuộc tổ mình */
export function canEditVillage(u: SessionUser, villageId: number | null | undefined) {
  return u.role === "ADMIN" || (villageId != null && u.villageId === villageId);
}
