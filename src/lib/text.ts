/** Bỏ dấu tiếng Việt, chữ thường – dùng cho tìm kiếm và sinh slug */
export function normalize(s: string | null | undefined): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(s: string): string {
  return normalize(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Tách từ khóa tìm kiếm thành các token không dấu */
export function tokens(q: string): string[] {
  return normalize(q)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .slice(0, 8);
}

export function formatPhone(p: string): string {
  const d = p.replace(/\D/g, "");
  if (d.length === 10) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  if (d.length === 11 && d.startsWith("02")) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  return p;
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("vi-VN");
}

export function formatDate(d: Date | string | null | undefined, withTime = false): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/** Tách danh sách SĐT từ ô nhập tự do (mỗi dòng / dấu phẩy / gạch ngang) */
export function parsePhones(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\n,;/]|\s-\s|-(?=\s*0)/)
        .map((x) => x.replace(/\D/g, ""))
        .filter((x) => x.length >= 3),
    ),
  );
}
