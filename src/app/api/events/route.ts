import { NextResponse, type NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";

const TYPES = new Set(["view", "call", "direction", "share"]);

/** Ghi sự kiện sử dụng (không lưu IP hay danh tính) */
export async function POST(req: NextRequest) {
  try {
    const { placeId, type } = await req.json();
    if (typeof placeId !== "string" || !TYPES.has(type)) return NextResponse.json({ ok: false }, { status: 400 });
    await db.insert(s.placeEvents).values({ placeId, type });
    if (type === "view") {
      await db.update(s.places).set({ viewCount: sql`${s.places.viewCount} + 1`, updatedAt: sql`${s.places.updatedAt}` }).where(eq(s.places.id, placeId));
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
