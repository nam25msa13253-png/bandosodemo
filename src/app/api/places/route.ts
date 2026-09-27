import { NextResponse, type NextRequest } from "next/server";
import { listPlaces } from "@/lib/queries";
import { parseFilter } from "@/lib/filters";

export const dynamic = "force-dynamic";

/** GET /api/places?q=&sector=&village=&verified=1&open=1&lat=&lng=&radius=&sort=&page=&pageSize= */
export async function GET(req: NextRequest) {
  const f = parseFilter(req.nextUrl.searchParams);
  const data = await listPlaces(f);
  return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=30" } });
}
