import { normalize } from "./text";

/** Sinh chuỗi tìm kiếm không dấu cho cơ sở */
export function placeSearchText(p: {
  name: string;
  description?: string | null;
  address?: string | null;
  phones?: string[];
  sectorName?: string | null;
  villageName?: string | null;
}) {
  return normalize(
    [p.name, p.sectorName, p.villageName, p.address, (p.phones ?? []).join(" "), p.description]
      .filter(Boolean)
      .join(" | "),
  );
}

export function villageSearchText(v: {
  name: string;
  mergedFrom?: string | null;
  secretaryName?: string | null;
  leaderName?: string | null;
  frontHeadName?: string | null;
  code?: number;
}) {
  return normalize(
    [v.name, `to ${v.code}`, `tdp ${v.code}`, v.mergedFrom, v.secretaryName, v.leaderName, v.frontHeadName]
      .filter(Boolean)
      .join(" | "),
  );
}

export function announcementSearchText(a: { title: string; summary?: string | null; content?: string | null }) {
  return normalize([a.title, a.summary, a.content].filter(Boolean).join(" | "));
}
