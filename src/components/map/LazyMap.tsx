"use client";
import dynamic from "next/dynamic";

/** Bản đồ tải phía trình duyệt, không chặn hiển thị trang */
export const LazyMap = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="h-full min-h-[300px] w-full animate-pulse rounded-2xl bg-slate-200" />,
});
