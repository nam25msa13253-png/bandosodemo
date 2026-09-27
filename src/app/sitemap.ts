import type { MetadataRoute } from "next";
import { ne } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { siteUrl } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [places, villages, anns] = await Promise.all([
    db.select({ slug: s.places.slug, updatedAt: s.places.updatedAt }).from(s.places).where(ne(s.places.status, "HIDDEN")),
    db.select({ slug: s.villages.slug, updatedAt: s.villages.updatedAt }).from(s.villages),
    db.select({ slug: s.announcements.slug, updatedAt: s.announcements.updatedAt }).from(s.announcements),
  ]);
  return [
    ...["", "/danh-muc", "/ban-do-hanh-chinh", "/thong-bao", "/lien-he"].map((p) => ({ url: `${base}${p}` })),
    ...places.map((p) => ({ url: `${base}/dich-vu/${p.slug}`, lastModified: p.updatedAt })),
    ...villages.map((v) => ({ url: `${base}/to-dan-pho/${v.slug}`, lastModified: v.updatedAt })),
    ...anns.map((a) => ({ url: `${base}/thong-bao/${a.slug}`, lastModified: a.updatedAt })),
  ];
}
