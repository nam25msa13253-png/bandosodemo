import Link from "next/link";
import { MapPinOff } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <MapPinOff className="mx-auto h-16 w-16 text-slate-300" />
      <h1 className="mt-4 text-2xl font-extrabold text-slate-800">Không tìm thấy trang</h1>
      <p className="mt-2 text-slate-500">Liên kết có thể đã thay đổi hoặc cơ sở không còn trên hệ thống.</p>
      <form action="/tim-kiem" className="mt-6 flex gap-2">
        <input name="q" placeholder="Tìm cơ sở, tổ dân phố..." className="input" />
        <button className="btn btn-primary">Tìm</button>
      </form>
      <Link href="/" className="mt-4 inline-block text-sm font-semibold text-navy-700">← Về trang chủ</Link>
    </div>
  );
}
