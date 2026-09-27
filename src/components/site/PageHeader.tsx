import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function PageHeader({ title, subtitle, crumbs = [] }: { title: string; subtitle?: string; crumbs?: { href?: string; label: string }[] }) {
  return (
    <div className="bg-navy-800 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        <nav className="flex flex-wrap items-center gap-1 text-xs text-white/60">
          <Link href="/" className="hover:text-white">Trang chủ</Link>
          {crumbs.map((c, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              {c.href ? <Link href={c.href} className="hover:text-white">{c.label}</Link> : <span className="text-white/85">{c.label}</span>}
            </span>
          ))}
        </nav>
        <h1 className="mt-2 text-2xl font-extrabold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-sm text-white/80">{subtitle}</p>}
      </div>
    </div>
  );
}
