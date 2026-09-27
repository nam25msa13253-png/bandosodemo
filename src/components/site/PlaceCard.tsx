import Link from "next/link";
import { BadgeCheck, Clock, MapPin, Navigation, Phone } from "lucide-react";
import type { PlaceListItem } from "@/lib/queries";
import { directionsUrl, formatDistance } from "@/lib/geo";
import { formatPhone } from "@/lib/text";
import { SectorIcon } from "../SectorIcon";
import { OpenBadge } from "./OpenBadge";
import { TrackLink } from "./TrackLink";
import { SafeImg } from "./SafeImg";

export function PlaceCard({ p }: { p: PlaceListItem }) {
  const dir = directionsUrl(p);
  const inactive = p.status === "INACTIVE";
  return (
    <article className={`card flex flex-col overflow-hidden ${inactive ? "opacity-70" : ""}`}>
      <Link href={`/dich-vu/${p.slug}`} className="flex gap-3 p-3.5">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
          <SafeImg
            src={p.image ?? ""}
            className="h-full w-full object-cover"
            fallback={
              <div className="grid h-full w-full place-items-center" style={{ background: p.sectorColor + "1a" }}>
                <SectorIcon name={p.sectorIcon} className="h-8 w-8" style={{ color: p.sectorColor }} />
              </div>
            }
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: p.sectorColor }}>
            <SectorIcon name={p.sectorIcon} className="h-3.5 w-3.5" /> {p.sectorName}
          </p>
          <h3 className="mt-0.5 line-clamp-2 font-bold leading-snug text-slate-800">
            {p.name}
            {p.verified && <BadgeCheck className="ml-1 inline h-4 w-4 text-sky-600" aria-label="Đã xác minh" />}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            {p.villageName && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {p.villageName}
              </span>
            )}
            {p.distanceKm != null && <span className="font-semibold text-navy-700">{formatDistance(p.distanceKm)}</span>}
            {p.openingHours && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {p.openingHours}
              </span>
            )}
          </div>
          <div className="mt-1.5">
            <OpenBadge state={p.open} inactive={inactive} />
          </div>
        </div>
      </Link>
      <div className="mt-auto grid grid-cols-2 border-t border-slate-100 text-sm font-semibold">
        {p.phones[0] && !inactive ? (
          <TrackLink placeId={p.id} type="call" href={`tel:${p.phones[0]}`} className="flex items-center justify-center gap-1.5 py-2.5 text-emerald-700 hover:bg-emerald-50">
            <Phone className="h-4 w-4" /> {formatPhone(p.phones[0])}
          </TrackLink>
        ) : (
          <span className="flex items-center justify-center py-2.5 text-slate-300">Chưa có SĐT</span>
        )}
        {dir ? (
          <TrackLink placeId={p.id} type="direction" href={dir} external className="flex items-center justify-center gap-1.5 border-l border-slate-100 py-2.5 text-navy-700 hover:bg-navy-50">
            <Navigation className="h-4 w-4" /> Chỉ đường
          </TrackLink>
        ) : (
          <span className="flex items-center justify-center border-l border-slate-100 py-2.5 text-slate-300">Chưa có vị trí</span>
        )}
      </div>
    </article>
  );
}
