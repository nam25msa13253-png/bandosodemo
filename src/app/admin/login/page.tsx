import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Đăng nhập quản trị", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/admin" } = await searchParams;
  const st = await getSettings();
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-navy-900 to-navy-700 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Trang quản trị</p>
        <h1 className="mt-1 text-xl font-extrabold text-navy-800">{st.site_name}</h1>
        <p className="mb-5 mt-1 text-sm text-slate-500">Dành cho cán bộ phường và tổ dân phố</p>
        <LoginForm next={next} />
        <Link href="/" className="mt-5 block text-center text-sm text-slate-500 hover:text-navy-700">← Về trang tra cứu</Link>
      </div>
    </div>
  );
}
