"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [idx, setIdx] = useState<number | null>(null);
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const box = useRef<HTMLDivElement>(null);
  // ảnh lỗi trước khi hydrate không kích hoạt onError -> kiểm tra lại
  useEffect(() => {
    const bad = new Set<string>();
    box.current?.querySelectorAll("img").forEach((img) => {
      if (img.complete && img.naturalWidth === 0) bad.add(img.getAttribute("src")!);
    });
    if (bad.size) setBroken(bad);
  }, []);
  const list = images.filter((i) => !broken.has(i));
  if (!list.length) return null;
  const main = list[0];
  return (
    <>
      <div ref={box} className={`grid gap-2 ${list.length > 1 ? "grid-cols-4 grid-rows-2" : ""} h-64 md:h-80`}>
        {list.slice(0, 5).map((src, i) => (
          <button
            key={src}
            onClick={() => setIdx(i)}
            className={`overflow-hidden rounded-xl bg-slate-100 ${i === 0 && list.length > 1 ? "col-span-2 row-span-2" : ""} ${
              list.length === 2 && i === 1 ? "col-span-2 row-span-2" : ""
            } ${list.length === 1 ? "h-full w-full" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${name} – ảnh ${i + 1}`}
              className="h-full w-full object-cover transition hover:scale-105"
              onError={() => setBroken((b) => new Set(b).add(src))}
            />
          </button>
        ))}
      </div>
      {idx != null && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4" onClick={() => setIdx(null)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white" aria-label="Đóng">
            <X className="h-6 w-6" />
          </button>
          {list.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setIdx((idx - 1 + list.length) % list.length); }}
                className="absolute left-3 rounded-full bg-white/10 p-2 text-white"
                aria-label="Ảnh trước"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIdx((idx + 1) % list.length); }}
                className="absolute right-3 rounded-full bg-white/10 p-2 text-white"
                aria-label="Ảnh sau"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={list[idx] ?? main} alt="" className="max-h-[85vh] max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
