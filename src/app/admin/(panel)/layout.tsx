import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { ExternalLink, LogOut } from "lucide-react";
import { db, schema as s } from "@/db";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { AdminNav } from "@/components/admin/AdminNav";
import { logout } from "../login/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Quản trị", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const st = await getSettings();
  const [{ n: pending }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.submissions)
    .where(eq(s.submissions.status, "PENDING"));
  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <aside className="bg-navy-900 p-4 text-white md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:overflow-auto">
        <Link href="/admin" className="block">
          <p className="text-[10px] uppercase tracking-widest text-white/50">Quản trị hệ thống</p>
          <p className="font-extrabold text-accent">{st.site_name}</p>
        </Link>
        <div className="my-4 rounded-xl bg-white/5 p-3 text-sm">
          <p className="font-semibold">{user.fullName}</p>
          <p className="text-xs text-white/60">{user.role === "ADMIN" ? "Quản trị phường" : "Cán bộ tổ dân phố"}</p>
        </div>
        <AdminNav isAdmin={user.role === "ADMIN"} pending={pending} />
        <div className="mt-4 space-y-1 border-t border-white/10 pt-4">
          <Link href="/" target="_blank" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/10">
            <ExternalLink className="h-4 w-4" /> Xem trang công khai
          </Link>
          <form action={logout}>
            <button className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/10">
              <LogOut className="h-4 w-4" /> Đăng xuất
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}
