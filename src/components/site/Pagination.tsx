import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, total, pageSize, makeHref }: { page: number; total: number; pageSize: number; makeHref: (p: number) => string }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const nums: number[] = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) nums.push(i);
  const cls = "grid h-10 min-w-10 place-items-center rounded-xl border px-2 text-sm font-semibold";
  return (
    <nav className="mt-6 flex flex-wrap items-center justify-center gap-1.5" aria-label="Phân trang">
      {page > 1 && (
        <Link href={makeHref(page - 1)} className={`${cls} border-slate-200 bg-white`} aria-label="Trang trước">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      {nums[0] > 1 && <Link href={makeHref(1)} className={`${cls} border-slate-200 bg-white`}>1</Link>}
      {nums[0] > 2 && <span className="px-1 text-slate-400">…</span>}
      {nums.map((n) => (
        <Link key={n} href={makeHref(n)} className={`${cls} ${n === page ? "border-navy-800 bg-navy-800 text-white" : "border-slate-200 bg-white"}`}>
          {n}
        </Link>
      ))}
      {nums[nums.length - 1] < pages - 1 && <span className="px-1 text-slate-400">…</span>}
      {nums[nums.length - 1] < pages && <Link href={makeHref(pages)} className={`${cls} border-slate-200 bg-white`}>{pages}</Link>}
      {page < pages && (
        <Link href={makeHref(page + 1)} className={`${cls} border-slate-200 bg-white`} aria-label="Trang sau">
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
