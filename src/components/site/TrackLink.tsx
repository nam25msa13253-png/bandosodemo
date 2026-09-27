"use client";
/** Link có ghi nhận sự kiện (gọi / chỉ đường) để thống kê – không lưu danh tính */
export function track(placeId: string, type: "call" | "direction" | "share" | "view") {
  try {
    const body = JSON.stringify({ placeId, type });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    else fetch("/api/events", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
  } catch {}
}

export function TrackLink({
  placeId, type, href, className, children, external,
}: {
  placeId: string;
  type: "call" | "direction";
  href: string;
  className?: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={() => track(placeId, type)}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
