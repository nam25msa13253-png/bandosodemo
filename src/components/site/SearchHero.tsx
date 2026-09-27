"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Store, Users, Megaphone, Loader2 } from "lucide-react";

type Suggest = {
  villages: { slug: string; name: string; mergedFrom: string | null }[];
  places: { slug: string; name: string; sectorName: string; villageName: string | null }[];
  announcements: { slug: string; title: string }[];
};

export function SearchHero({
  title, tagline, banner, placeholder, unitName,
}: { title: string; tagline: string; banner: string; placeholder: string; unitName: string }) {
  const [mode, setMode] = useState<"place" | "village">("place");
  const [q, setQ] = useState("");
  const [sug, setSug] = useState<Suggest | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setSug(null);
      return;
    }
    setLoading(true);
    const ctl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}&limit=5`, { signal: ctl.signal })
        .then((r) => r.json())
        .then((d) => {
          setSug(d);
          setOpen(true);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (mode === "village") router.push(`/tim-kiem?type=village&q=${encodeURIComponent(term)}`);
    else router.push(`/danh-muc?q=${encodeURIComponent(term)}`);
  }

  const empty = sug && !sug.villages.length && !sug.places.length && !sug.announcements.length;

  return (
    <section className="relative isolate overflow-visible bg-navy-800">
      {banner && (
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-center opacity-35"
          style={{ backgroundImage: `url("${banner.replace(/"/g, "%22")}")` }}
        />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-navy-900/60 via-navy-800/70 to-navy-800" />
      <div className="mx-auto max-w-3xl px-4 pb-10 pt-8 text-center md:pb-14 md:pt-14">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">Bản đồ số 4.0</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-accent drop-shadow md:text-5xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/85 md:text-base">{tagline}</p>

        <div ref={box} className="relative mx-auto mt-6 max-w-2xl text-left">
          <div className="mb-2 inline-flex rounded-xl bg-white/10 p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setMode("place")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 ${mode === "place" ? "bg-accent text-slate-900" : "text-white/85"}`}
            >
              <Store className="h-4 w-4" /> Dịch vụ tiện ích
            </button>
            <button
              type="button"
              onClick={() => setMode("village")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 ${mode === "village" ? "bg-accent text-slate-900" : "text-white/85"}`}
            >
              <Users className="h-4 w-4" /> {unitName}
            </button>
          </div>
          <form onSubmit={submit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => sug && setOpen(true)}
                placeholder={mode === "village" ? `Nhập tên ${unitName.toLowerCase()} cũ/mới, tên cán bộ...` : placeholder}
                className="h-12 w-full rounded-xl border border-slate-600 bg-slate-900/80 pl-11 pr-10 text-[15px] text-white outline-none placeholder:text-slate-400 focus:border-accent"
                aria-label="Từ khóa tìm kiếm"
              />
              {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}
            </div>
            <button className="h-12 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 px-5 font-extrabold text-slate-900 shadow hover:to-amber-600">
              Tìm
            </button>
          </form>

          {open && sug && (
            <div className="absolute inset-x-0 top-full z-30 mt-2 max-h-[60vh] overflow-auto rounded-2xl border border-slate-200 bg-white p-2 text-slate-700 shadow-xl">
              {empty && <p className="p-3 text-sm text-slate-500">Không tìm thấy kết quả phù hợp. Thử từ khóa ngắn hơn.</p>}
              {sug.villages.map((v) => (
                <Link key={v.slug} href={`/to-dan-pho/${v.slug}`} className="flex gap-3 rounded-xl p-2.5 hover:bg-slate-50">
                  <Users className="mt-0.5 h-5 w-5 shrink-0 text-navy-700" />
                  <span className="min-w-0">
                    <span className="block font-semibold">{v.name}</span>
                    <span className="block truncate text-xs text-slate-500">Sáp nhập từ: {v.mergedFrom}</span>
                  </span>
                </Link>
              ))}
              {sug.places.map((p) => (
                <Link key={p.slug} href={`/dich-vu/${p.slug}`} className="flex gap-3 rounded-xl p-2.5 hover:bg-slate-50">
                  <Store className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{p.name}</span>
                    <span className="block text-xs text-slate-500">
                      {p.sectorName}
                      {p.villageName ? ` · ${p.villageName}` : ""}
                    </span>
                  </span>
                </Link>
              ))}
              {sug.announcements.map((a) => (
                <Link key={a.slug} href={`/thong-bao/${a.slug}`} className="flex gap-3 rounded-xl p-2.5 hover:bg-slate-50">
                  <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <span className="block font-semibold">{a.title}</span>
                </Link>
              ))}
              {!empty && (
                <Link href={`/tim-kiem?q=${encodeURIComponent(q)}`} className="mt-1 block rounded-xl bg-slate-50 p-2.5 text-center text-sm font-semibold text-navy-700">
                  Xem tất cả kết quả cho “{q}”
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
