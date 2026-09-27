import Link from "next/link";

export function AdminTitle({ title, desc, actions }: { title: string; desc?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">{title}</h1>
        {desc && <p className="mt-0.5 text-sm text-slate-500">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Flash({ msg, err }: { msg?: string; err?: string }) {
  if (!msg && !err) return null;
  return (
    <div className={`mb-4 rounded-xl p-3 text-sm font-medium ${err ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
      {err || msg}
    </div>
  );
}

export function StatCard({ label, value, href, tone = "navy" }: { label: string; value: string | number; href?: string; tone?: "navy" | "rose" | "amber" | "emerald" }) {
  const toneCls = { navy: "text-navy-800", rose: "text-rose-600", amber: "text-amber-600", emerald: "text-emerald-600" }[tone];
  const body = (
    <>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-extrabold ${toneCls}`}>{value}</p>
    </>
  );
  return href ? <Link href={href} className="card block p-4 hover:border-navy-600">{body}</Link> : <div className="card p-4">{body}</div>;
}
