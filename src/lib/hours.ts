/**
 * Hiểu giờ hoạt động dạng văn bản tự do để tính "Đang mở cửa".
 * Dữ liệu gốc có >20 kiểu viết: "7:00-22:00", "7h30 - 17h30", "6h - 22h hàng ngày",
 * "24/24", "Giờ hành chính", "7h30 sáng đến 15h30 chiều"...
 * Không hiểu được -> trạng thái "unknown" (không đoán).
 */
export type Hours =
  | { kind: "always" }
  | { kind: "ranges"; ranges: [number, number][]; weekdaysOnly?: boolean }
  | { kind: "unknown" };

const TIME = String.raw`(\d{1,2})\s*(?:[:h.]\s*(\d{1,2}))?\s*h?`;

function toMin(h: string, m?: string) {
  return parseInt(h, 10) * 60 + (m ? parseInt(m, 10) : 0);
}

export function parseHours(raw: string | null | undefined): Hours {
  if (!raw) return { kind: "unknown" };
  let s = raw
    .toLowerCase()
    .normalize("NFC")
    .replace(/hàng ngày|mỗi ngày|cả tuần|sáng|chiều|tối|giờ/g, (w) => (w === "giờ" ? w : " "))
    .replace(/đến|tới|–|—|~/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  if (/24\s*\/\s*24|^24h$|24\/7|cả ngày/.test(s)) return { kind: "always" };
  if (/giờ hành chính|hanh chinh/.test(s)) {

    return { kind: "ranges", ranges: [[450, 690], [810, 1020]], weekdaysOnly: true };
  }
  s = s.replace(/giờ/g, "");
  const re = new RegExp(`${TIME}\\s*-\\s*${TIME}`, "g");
  const ranges: [number, number][] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const open = toMin(m[1], m[2]);
    let close = toMin(m[3], m[4]);
    if (close === 0) close = 1440;
    if (open < 1440 && close <= 1440) ranges.push([open, close]);
  }
  if (ranges.length) return { kind: "ranges", ranges };
  return { kind: "unknown" };
}

/** Giờ hiện tại ở Việt Nam */
function nowVN(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  return { minutes: parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10), weekday: get("weekday") };
}

export type OpenState = "open" | "closed" | "unknown";

export function openState(raw: string | null | undefined, date = new Date()): OpenState {
  const h = parseHours(raw);
  if (h.kind === "always") return "open";
  if (h.kind === "unknown") return "unknown";
  const { minutes, weekday } = nowVN(date);
  if (h.weekdaysOnly && (weekday === "Sat" || weekday === "Sun")) return "closed";
  for (const [o, c] of h.ranges) {
    if (c > o ? minutes >= o && minutes < c : minutes >= o || minutes < c) return "open";
  }
  return "closed";
}
