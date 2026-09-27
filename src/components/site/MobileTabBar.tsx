"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, LayoutGrid, Users, Bell, Phone } from "lucide-react";
import { NAV } from "./nav";

const ICONS = { Map, LayoutGrid, Users, Bell, Phone };

/** Thanh tab cố định dưới đáy màn hình điện thoại (giống web gốc) */
export function MobileTabBar() {
  const path = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-navy-900 bg-navy-800 pb-[env(safe-area-inset-bottom)] text-white md:hidden no-print"
      aria-label="Điều hướng chính"
    >
      {NAV.map((n) => {
        const Icon = ICONS[n.icon];
        const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
              active ? "text-accent" : "text-white/75"
            }`}
          >
            <Icon className="h-5 w-5" />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
