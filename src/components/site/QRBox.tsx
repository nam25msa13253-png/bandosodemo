"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer } from "lucide-react";

export function QRBox({ url, fileName, printHref }: { url: string; fileName: string; printHref?: string }) {
  const [data, setData] = useState<string | null>(null);
  useEffect(() => {
    QRCode.toDataURL(url, { width: 480, margin: 1, color: { dark: "#0f3460" } }).then(setData);
  }, [url]);
  return (
    <div className="card p-4 text-center">
      <p className="font-bold text-slate-800">Quét mã QR để truy cập</p>
      <div className="mx-auto mt-3 grid aspect-square w-44 place-items-center rounded-xl border border-slate-100 bg-white p-2">
        {data ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data} alt={`Mã QR ${fileName}`} className="h-full w-full" />
        ) : (
          <span className="text-xs text-slate-400">Đang tạo mã QR...</span>
        )}
      </div>
      <div className="mt-3 flex justify-center gap-2">
        {data && (
          <a href={data} download={`qr-${fileName}.png`} className="btn btn-outline">
            <Download className="h-4 w-4" /> Tải về
          </a>
        )}
        {printHref && (
          <a href={printHref} target="_blank" className="btn btn-outline">
            <Printer className="h-4 w-4" /> In tem
          </a>
        )}
      </div>
    </div>
  );
}
