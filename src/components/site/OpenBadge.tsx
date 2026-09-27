export function OpenBadge({ state, inactive }: { state: "open" | "closed" | "unknown"; inactive?: boolean }) {
  if (inactive)
    return <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Ngừng hoạt động</span>;
  if (state === "open")
    return <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">● Đang mở cửa</span>;
  if (state === "closed")
    return <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200">Đã đóng cửa</span>;
  return null;
}
