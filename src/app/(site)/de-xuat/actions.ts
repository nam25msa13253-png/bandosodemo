"use server";
import crypto from "node:crypto";
import { headers } from "next/headers";
import { and, eq, gt, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { getSettings } from "@/lib/settings";

export type SubmitState = { ok: boolean; message: string } | null;

const TYPES = ["NEW_PLACE", "WRONG_PHONE", "WRONG_HOURS", "WRONG_LOCATION", "CLOSED", "OTHER"] as const;

export async function submitSuggestion(_prev: SubmitState, form: FormData): Promise<SubmitState> {
  const st = await getSettings();
  if (st.allow_submissions !== "true") return { ok: false, message: "Chức năng đề xuất đang tạm đóng." };
  // bẫy bot: trường ẩn phải trống
  if (String(form.get("website2") ?? "")) return { ok: true, message: "Đã gửi." };

  const type = String(form.get("type")) as (typeof TYPES)[number];
  if (!TYPES.includes(type)) return { ok: false, message: "Loại đề xuất không hợp lệ." };
  const content = String(form.get("content") ?? "").trim().slice(0, 2000);
  const name = String(form.get("name") ?? "").trim().slice(0, 200) || null;
  if (type === "NEW_PLACE" && !name) return { ok: false, message: "Vui lòng nhập tên cơ sở." };
  if (!content && type !== "CLOSED") return { ok: false, message: "Vui lòng mô tả nội dung đề xuất." };
  if (form.get("consent") !== "on") return { ok: false, message: "Vui lòng đồng ý cho phép xử lý thông tin." };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const ipHash = crypto.createHash("sha256").update(ip + (process.env.AUTH_SECRET ?? "")).digest("hex").slice(0, 32);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.submissions)
    .where(and(eq(s.submissions.ipHash, ipHash), gt(s.submissions.createdAt, new Date(Date.now() - 3600_000))));
  if (n >= 5) return { ok: false, message: "Bạn đã gửi quá nhiều đề xuất trong 1 giờ. Vui lòng thử lại sau." };

  let placeId: string | null = null;
  const placeSlug = String(form.get("place") ?? "");
  if (placeSlug) {
    const p = await db.query.places.findFirst({ where: eq(s.places.slug, placeSlug), columns: { id: true } });
    placeId = p?.id ?? null;
  }
  const lat = Number(form.get("lat"));
  const lng = Number(form.get("lng"));

  await db.insert(s.submissions).values({
    type,
    placeId,
    name,
    sectorId: String(form.get("sectorId") ?? "") || null,
    phone: String(form.get("phone") ?? "").trim().slice(0, 50) || null,
    address: String(form.get("address") ?? "").trim().slice(0, 300) || null,
    content: content || "Cơ sở đã ngừng hoạt động",
    lat: Number.isFinite(lat) && lat ? lat : null,
    lng: Number.isFinite(lng) && lng ? lng : null,
    contactName: String(form.get("contactName") ?? "").trim().slice(0, 100) || null,
    contactPhone: String(form.get("contactPhone") ?? "").trim().slice(0, 20) || null,
    ipHash,
  });
  return { ok: true, message: "Cảm ơn bạn! Đề xuất đã được gửi tới cán bộ phường và sẽ được xử lý trong 3 ngày làm việc." };
}
