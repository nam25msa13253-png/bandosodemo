import { and, asc, desc, eq, inArray, isNotNull, like, ne, or, sql, type SQL, type AnyColumn } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { normalize, tokens } from "./text";
import { openState } from "./hours";

export type PlaceFilter = {
  q?: string;
  sectors?: string[];
  village?: number | null;
  verified?: boolean;
  openNow?: boolean;
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number | null;
  sort?: "relevance" | "name" | "distance" | "updated" | "popular";
  page?: number;
  pageSize?: number;
  /** chỉ lấy cơ sở có toạ độ (dùng cho bản đồ) */
  withCoords?: boolean;
};

export type PlaceListItem = {
  id: string;
  slug: string;
  name: string;
  sectorId: string;
  sectorName: string;
  sectorColor: string;
  sectorIcon: string;
  villageId: number | null;
  villageName: string | null;
  phones: string[];
  openingHours: string | null;
  lat: number | null;
  lng: number | null;
  locationUrl: string | null;
  description: string | null;
  image: string | null;
  verified: boolean;
  status: "ACTIVE" | "INACTIVE" | "HIDDEN";
  featured: boolean;
  updatedAt: Date;
  distanceKm: number | null;
  open: "open" | "closed" | "unknown";
};

function distanceExpr(lat: number, lng: number) {
  return sql<number>`(6371 * 2 * asin(sqrt(
    power(sin(radians(${s.places.lat} - ${lat}) / 2), 2) +
    cos(radians(${lat})) * cos(radians(${s.places.lat})) *
    power(sin(radians(${s.places.lng} - ${lng}) / 2), 2)
  )))`;
}

/** Token là số -> so khớp nguyên từ (tránh "1" khớp "10", "1A") */
function tokenCond(col: AnyColumn, t: string): SQL {
  return /^\d+$/.test(t) ? sql`${col} ~ ${"\\m" + t + "\\M"}` : like(col, `%${t}%`);
}

function textConditions(q: string | undefined): SQL[] {
  if (!q) return [];
  return tokens(q).map((t) => tokenCond(s.places.searchText, t));
}

/** Danh sách cơ sở công khai có lọc / sắp xếp / phân trang (chạy ở server) */
export async function listPlaces(f: PlaceFilter): Promise<{ items: PlaceListItem[]; total: number }> {
  const page = Math.max(1, f.page ?? 1);
  const pageSize = Math.min(1000, Math.max(1, f.pageSize ?? 20));
  const hasLoc = f.lat != null && f.lng != null && !Number.isNaN(f.lat) && !Number.isNaN(f.lng);
  const dist = hasLoc ? distanceExpr(f.lat!, f.lng!) : null;

  const where: SQL[] = [ne(s.places.status, "HIDDEN"), ...textConditions(f.q)];
  if (f.sectors?.length) where.push(inArray(s.places.sectorId, f.sectors));
  if (f.village) where.push(eq(s.places.villageId, f.village));
  if (f.verified) where.push(eq(s.places.verified, true));
  if (f.withCoords || (dist && f.radiusKm)) where.push(isNotNull(s.places.lat));
  if (dist && f.radiusKm) where.push(sql`${dist} <= ${f.radiusKm}`);

  const nq = normalize(f.q);
  const score = nq
    ? sql<number>`(case when ${s.places.searchText} like ${nq + "%"} then 3 else 0 end
        + case when split_part(${s.places.searchText}, ' | ', 1) like ${"%" + nq + "%"} then 2 else 0 end)`
    : sql<number>`0`;

  let order: SQL[];
  switch (f.sort) {
    case "name":
      order = [asc(s.places.name)];
      break;
    case "distance":
      order = dist ? [sql`${dist} asc nulls last`] : [asc(s.places.name)];
      break;
    case "updated":
      order = [desc(s.places.updatedAt)];
      break;
    case "popular":
      order = [desc(s.places.viewCount), asc(s.places.name)];
      break;
    default:
      order = [
        ...(nq ? [desc(score)] : []),
        desc(s.places.featured),
        ...(dist ? [sql`${dist} asc nulls last`] : []),
        desc(s.places.verified),
        desc(sql`cardinality(${s.places.images}) > 0`),
        desc(s.places.viewCount),
        asc(s.places.name),
      ];
  }

  const baseSelect = {
    id: s.places.id,
    slug: s.places.slug,
    name: s.places.name,
    sectorId: s.places.sectorId,
    sectorName: s.sectors.name,
    sectorColor: s.sectors.color,
    sectorIcon: s.sectors.icon,
    villageId: s.places.villageId,
    villageName: s.villages.name,
    phones: s.places.phones,
    openingHours: s.places.openingHours,
    lat: s.places.lat,
    lng: s.places.lng,
    locationUrl: s.places.locationUrl,
    description: s.places.description,
    image: sql<string | null>`${s.places.images}[1]`,
    verified: s.places.verified,
    status: s.places.status,
    featured: s.places.featured,
    updatedAt: s.places.updatedAt,
    distanceKm: dist ? sql<number | null>`${dist}` : sql<number | null>`null::float`,
  };

  const query = db
    .select(baseSelect)
    .from(s.places)
    .innerJoin(s.sectors, eq(s.sectors.id, s.places.sectorId))
    .leftJoin(s.villages, eq(s.villages.id, s.places.villageId))
    .where(and(...where))
    .orderBy(...order);

  const withOpen = (r: Omit<PlaceListItem, "open">): PlaceListItem => ({
    ...r,
    distanceKm: r.distanceKm == null ? null : Number(r.distanceKm),
    open: r.status === "INACTIVE" ? "closed" : openState(r.openingHours),
  });

  if (f.openNow) {
    // "Đang mở cửa" phải tính theo giờ hiện tại -> lọc sau khi truy vấn
    const all = (await query).map(withOpen).filter((p) => p.open === "open");
    return { items: all.slice((page - 1) * pageSize, page * pageSize), total: all.length };
  }

  const [rows, [{ total }]] = await Promise.all([
    query.limit(pageSize).offset((page - 1) * pageSize),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(s.places)
      .where(and(...where)),
  ]);
  return { items: rows.map(withOpen), total };
}

/** Đếm số cơ sở theo lĩnh vực (đếm đúng theo sector_id – web gốc bị lệch) */
export async function sectorCounts(): Promise<Record<string, number>> {
  const rows = await db
    .select({ id: s.places.sectorId, n: sql<number>`count(*)::int` })
    .from(s.places)
    .where(ne(s.places.status, "HIDDEN"))
    .groupBy(s.places.sectorId);
  return Object.fromEntries(rows.map((r) => [r.id, r.n]));
}

export async function villageCounts(): Promise<Record<number, number>> {
  const rows = await db
    .select({ id: s.places.villageId, n: sql<number>`count(*)::int` })
    .from(s.places)
    .where(and(ne(s.places.status, "HIDDEN"), isNotNull(s.places.villageId)))
    .groupBy(s.places.villageId);
  return Object.fromEntries(rows.map((r) => [r.id!, r.n]));
}

/** Tìm kiếm hợp nhất: tổ dân phố + cơ sở + thông báo (chỉ trả trường được phép công khai) */
export async function unifiedSearch(q: string, limit = 20) {
  const toks = tokens(q);
  if (!toks.length) return { villages: [], places: [], announcements: [] };
  const vWhere = and(...toks.map((t) => tokenCond(s.villages.searchText, t)));
  const aWhere = and(
    eq(s.announcements.published, true),
    ...toks.map((t) => tokenCond(s.announcements.searchText, t)),
  );
  const [villages, placesRes, announcements] = await Promise.all([
    db
      .select({
        id: s.villages.id,
        slug: s.villages.slug,
        name: s.villages.name,
        mergedFrom: s.villages.mergedFrom,
        leaderName: s.villages.leaderName,
        secretaryName: s.villages.secretaryName,
      })
      .from(s.villages)
      .where(vWhere)
      .orderBy(asc(s.villages.code))
      .limit(limit),
    listPlaces({ q, pageSize: limit }),
    db
      .select({
        slug: s.announcements.slug,
        title: s.announcements.title,
        summary: s.announcements.summary,
        publishedAt: s.announcements.publishedAt,
      })
      .from(s.announcements)
      .where(aWhere)
      .orderBy(desc(s.announcements.publishedAt))
      .limit(limit),
  ]);
  return { villages, places: placesRes.items, placesTotal: placesRes.total, announcements };
}

export async function getPlaceBySlug(slug: string) {
  const place = await db.query.places.findFirst({
    where: eq(s.places.slug, slug),
    with: { sector: true, village: true },
  });
  if (place) return { place, redirectTo: null as string | null };
  const redirect = await db
    .select({ slug: s.places.slug })
    .from(s.slugRedirects)
    .innerJoin(s.places, eq(s.places.id, s.slugRedirects.placeId))
    .where(eq(s.slugRedirects.fromSlug, slug))
    .limit(1);
  return { place: null, redirectTo: redirect[0]?.slug ?? null };
}

export async function latestAnnouncements(opts: { villageId?: number | null; q?: string; limit?: number } = {}) {
  const now = new Date();
  const where: SQL[] = [
    eq(s.announcements.published, true),
    sql`${s.announcements.publishedAt} <= ${now}`,
    or(sql`${s.announcements.expiresAt} is null`, sql`${s.announcements.expiresAt} > ${now}`)!,
  ];
  if (opts.villageId) {
    where.push(or(eq(s.announcements.villageId, opts.villageId), sql`${s.announcements.villageId} is null`)!);
  }
  for (const t of tokens(opts.q ?? "")) where.push(tokenCond(s.announcements.searchText, t));
  return db
    .select({
      id: s.announcements.id,
      slug: s.announcements.slug,
      title: s.announcements.title,
      summary: s.announcements.summary,
      pinned: s.announcements.pinned,
      publishedAt: s.announcements.publishedAt,
      villageName: s.villages.name,
    })
    .from(s.announcements)
    .leftJoin(s.villages, eq(s.villages.id, s.announcements.villageId))
    .where(and(...where))
    .orderBy(desc(s.announcements.pinned), desc(s.announcements.publishedAt))
    .limit(opts.limit ?? 50);
}
