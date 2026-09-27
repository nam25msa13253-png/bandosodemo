"use client";
import { useState } from "react";
import { useImgError } from "./SafeImg";
import Link from "next/link";
import { Users, Home, ChevronRight } from "lucide-react";
import { formatNumber } from "@/lib/text";

type V = {
  id: number; code: number; name: string; slug: string; polygon: [number, number][] | null;
  population: number | null; households: number | null; placeCount: number;
};

const PALETTE = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#ea580c", "#0891b2", "#ca8a04", "#db2777", "#4f46e5", "#059669", "#b91c1c", "#7c3aed", "#0d9488"];

/** Ảnh bản đồ hành chính + ranh giới tổ (toạ độ % trên ảnh, giống web gốc) */
export function VillageMap({ image, villages }: { image: string; villages: V[] }) {
  const [active, setActive] = useState<number | null>(null);
  const img = useImgError();
  const cur = villages.find((v) => v.id === active);
  const withPoly = villages.filter((v) => v.polygon && v.polygon.length > 2);

  return (
    <div className="card overflow-hidden">
      <div className="relative bg-slate-200">
        {image && !img.err ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img ref={img.ref} src={image} alt="Bản đồ địa giới hành chính" className="block w-full" onError={img.onError} />
        ) : (
          <div className="aspect-[4/3] w-full bg-[linear-gradient(135deg,#e2e8f0_25%,#f1f5f9_25%,#f1f5f9_50%,#e2e8f0_50%,#e2e8f0_75%,#f1f5f9_75%)] bg-[length:24px_24px]" />
        )}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {withPoly.map((v) => {
            const color = PALETTE[(v.code - 1) % PALETTE.length];
            const on = active === v.id;
            return (
              <polygon
                key={v.id}
                points={v.polygon!.map(([x, y]) => `${x},${y}`).join(" ")}
                fill={color}
                fillOpacity={on ? 0.55 : 0.25}
                stroke={on ? "#fbbf24" : color}
                strokeWidth={on ? 0.6 : 0.3}
                vectorEffect="non-scaling-stroke"
                className="cursor-pointer transition-all"
                onMouseEnter={() => setActive(v.id)}
                onClick={() => setActive(v.id)}
              >
                <title>{v.name}</title>
              </polygon>
            );
          })}
        </svg>
        {withPoly.map((v) => {
          const pts = v.polygon!;
          const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
          const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
          return (
            <span
              key={v.id}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-slate-800 shadow sm:text-xs"
              style={{ left: `${cx}%`, top: `${cy}%` }}
            >
              TDP {v.code}
            </span>
          );
        })}
      </div>
      <div className="border-t border-slate-100 p-4">
        {cur ? (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1">
              <p className="text-lg font-extrabold text-slate-800">{cur.name}</p>
              <p className="flex flex-wrap gap-4 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> {formatNumber(cur.population)} nhân khẩu</span>
                <span className="inline-flex items-center gap-1"><Home className="h-4 w-4" /> {formatNumber(cur.households)} hộ</span>
                <span>{cur.placeCount} cơ sở dịch vụ</span>
              </p>
            </div>
            <Link href={`/to-dan-pho/${cur.slug}`} className="btn btn-primary">
              Xem chi tiết <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Chạm vào một vùng trên bản đồ để xem thông tin tổ dân phố.
            {withPoly.length < villages.length && ` (${villages.length - withPoly.length} tổ chưa có ranh giới – xem ở danh sách.)`}
          </p>
        )}
      </div>
    </div>
  );
}
