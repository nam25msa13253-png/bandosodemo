import { cache } from "react";
import { asc } from "drizzle-orm";
import { db, schema as s } from "@/db";

export type SiteSettings = Record<string, string> & {
  site_name: string;
  site_short: string;
  site_tagline: string;
  meta_title: string;
  meta_description: string;
  logo_url: string;
  banner_url: string;
  admin_map_url: string;
  search_placeholder: string;
  unit_name: string;
  map_center_lat: string;
  map_center_lng: string;
  map_zoom: string;
  weather_place: string;
  contact_zalo: string;
  contact_hotline: string;
  contact_address: string;
  contact_email: string;
  about: string;
  allow_submissions: string;
  show_official_phones: string;
};

const DEFAULTS: SiteSettings = {
  site_name: "PHƯỜNG CỦA TÔI",
  site_short: "Phường",
  site_tagline: "Bản đồ số – Tra cứu tiện ích",
  meta_title: "Bản đồ số – Tra cứu tiện ích",
  meta_description: "Tra cứu tổ dân phố và các dịch vụ tiện ích",
  logo_url: "",
  banner_url: "",
  admin_map_url: "",
  search_placeholder: "Nhập tên cơ sở, dịch vụ, tổ dân phố...",
  unit_name: "Tổ dân phố",
  map_center_lat: "21.0278",
  map_center_lng: "105.8342",
  map_zoom: "14",
  weather_place: "",
  contact_zalo: "",
  contact_hotline: "",
  contact_address: "",
  contact_email: "",
  about: "",
  allow_submissions: "true",
  show_official_phones: "true",
};

/** Đọc toàn bộ cấu hình (cache trong 1 request) */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  const rows = await db.select().from(s.settings);
  const out = { ...DEFAULTS } as SiteSettings;
  for (const r of rows) out[r.key] = r.value;
  return out;
});

export const getSectors = cache(async () =>
  db.select().from(s.sectors).orderBy(asc(s.sectors.sortOrder), asc(s.sectors.name)),
);

export const getVillages = cache(async () =>
  db.select().from(s.villages).orderBy(asc(s.villages.code)),
);

export const getEmergency = cache(async () =>
  db.select().from(s.emergencyContacts).orderBy(asc(s.emergencyContacts.sortOrder)),
);

export const getAgencies = cache(async () =>
  db.select().from(s.agencies).orderBy(asc(s.agencies.sortOrder)),
);

export function siteUrl() {
  // Đọc lúc chạy (không bị "đóng băng" khi build). RENDER_EXTERNAL_URL do Render tự cấp.
  const env = process.env;
  return (env.SITE_URL || env.RENDER_EXTERNAL_URL || env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
