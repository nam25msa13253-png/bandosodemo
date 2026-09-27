"use client";
import { useState } from "react";
import { Undo2, Trash2 } from "lucide-react";

/** Vẽ ranh giới tổ trên ảnh bản đồ hành chính (toạ độ %) */
export function PolygonEditor({ image, initial }: { image: string; initial: [number, number][] }) {
  const [pts, setPts] = useState<[number, number][]>(initial);
  const add = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = +(((e.clientX - r.left) / r.width) * 100).toFixed(2);
    const y = +(((e.clientY - r.top) / r.height) * 100).toFixed(2);
    setPts((p) => [...p, [x, y]]);
  };
  return (
    <div>
      <div className="relative cursor-crosshair select-none overflow-hidden rounded-xl bg-slate-200" onClick={add}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="block w-full" draggable={false} />
        ) : (
          <div className="aspect-[4/3]" />
        )}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
          {pts.length > 2 && <polygon points={pts.map((p) => p.join(",")).join(" ")} fill="#2563eb" fillOpacity={0.3} stroke="#fbbf24" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />}
          {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={0.8} fill="#e11d48" />)}
        </svg>
      </div>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => setPts((p) => p.slice(0, -1))} className="btn btn-outline"><Undo2 className="h-4 w-4" /> Bỏ điểm cuối</button>
        <button type="button" onClick={() => setPts([])} className="btn btn-outline text-rose-600"><Trash2 className="h-4 w-4" /> Xoá hết</button>
        <span className="ml-auto self-center text-xs text-slate-500">{pts.length} điểm</span>
      </div>
      <input type="hidden" name="polygon" value={pts.length ? JSON.stringify(pts) : ""} />
    </div>
  );
}
