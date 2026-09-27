import type { PlaceFilter } from "./queries";

type SP = URLSearchParams | Record<string, string | string[] | undefined>;

function getAll(sp: SP, key: string): string[] {
  if (sp instanceof URLSearchParams) return sp.getAll(key);
  const v = sp[key];
  return v == null ? [] : Array.isArray(v) ? v : [v];
}
function get(sp: SP, key: string) {
  return getAll(sp, key)[0];
}
function num(v: string | undefined) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Đọc bộ lọc từ URL (dùng chung cho trang Danh mục và API) */
export function parseFilter(sp: SP): PlaceFilter {
  const sort = get(sp, "sort");
  return {
    q: (get(sp, "q") ?? "").slice(0, 100) || undefined,
    sectors: getAll(sp, "sector").flatMap((x) => x.split(",")).filter(Boolean),
    village: num(get(sp, "village")),
    verified: get(sp, "verified") === "1",
    openNow: get(sp, "open") === "1",
    lat: num(get(sp, "lat")),
    lng: num(get(sp, "lng")),
    radiusKm: num(get(sp, "radius")),
    sort: (["relevance", "name", "distance", "updated", "popular"].includes(sort ?? "") ? sort : "relevance") as PlaceFilter["sort"],
    page: num(get(sp, "page")) ?? 1,
    pageSize: num(get(sp, "pageSize")) ?? 20,
  };
}
