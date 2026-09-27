import { NextResponse, type NextRequest } from "next/server";
import { unifiedSearch } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Tìm kiếm hợp nhất – chỉ trả các trường được phép công khai (không trả SĐT cán bộ) */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").slice(0, 100);
  const limit = Math.min(50, Number(req.nextUrl.searchParams.get("limit")) || 20);
  const r = await unifiedSearch(q, limit);
  return NextResponse.json({
    query: q,
    villages: r.villages.map((v) => ({ slug: v.slug, name: v.name, mergedFrom: v.mergedFrom })),
    places: r.places.map((p) => ({
      slug: p.slug, name: p.name, sectorName: p.sectorName, sectorColor: p.sectorColor, villageName: p.villageName,
    })),
    placesTotal: r.placesTotal ?? 0,
    announcements: r.announcements.map((a) => ({ slug: a.slug, title: a.title })),
  });
}
