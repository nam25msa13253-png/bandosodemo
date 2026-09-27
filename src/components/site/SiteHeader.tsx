import Link from "next/link";
import { LogIn, Search } from "lucide-react";
import { NavLinks } from "./NavLinks";
import { SafeImg } from "./SafeImg";

export function SiteHeader({ siteName, logo }: { siteName: string; logo: string }) {
  return (
    <header className="sticky top-0 z-40 bg-navy-800 text-white shadow-md no-print">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 md:h-16">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <SafeImg
            src={logo}
            className="h-9 w-9 rounded-full bg-white object-contain p-0.5"
            fallback={<span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-extrabold text-navy-900">4.0</span>}
          />
          <span className="min-w-0 leading-tight">
            <span className="block text-[10px] font-medium uppercase tracking-widest text-white/70">
              Cổng tra cứu tiện ích
            </span>
            <span className="block truncate text-sm font-extrabold text-accent md:text-base">{siteName}</span>
          </span>
        </Link>
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          <NavLinks />
        </nav>
        <Link href="/tim-kiem" className="ml-auto rounded-lg p-2 hover:bg-white/10 md:ml-0" aria-label="Tìm kiếm">
          <Search className="h-5 w-5" />
        </Link>
        <Link
          href="/admin"
          className="hidden items-center gap-1.5 rounded-lg border border-white/25 px-3 py-1.5 text-sm font-medium hover:bg-white/10 md:inline-flex"
        >
          <LogIn className="h-4 w-4" /> Đăng nhập
        </Link>
      </div>
    </header>
  );
}
