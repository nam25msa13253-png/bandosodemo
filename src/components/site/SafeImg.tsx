"use client";
import { useEffect, useRef, useState } from "react";

/** Phát hiện ảnh hỏng (kể cả khi lỗi xảy ra trước lúc React hydrate) */
export function useImgError() {
  const ref = useRef<HTMLImageElement>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setErr(true);
  }, []);
  return { ref, err, onError: () => setErr(true) };
}

/** Ảnh có phương án dự phòng khi link ảnh hỏng */
export function SafeImg({ src, alt = "", className, fallback }: { src: string; alt?: string; className?: string; fallback: React.ReactNode }) {
  const { ref, err, onError } = useImgError();
  if (err || !src) return <>{fallback}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src} alt={alt} loading="lazy" className={className} onError={onError} />;
}
