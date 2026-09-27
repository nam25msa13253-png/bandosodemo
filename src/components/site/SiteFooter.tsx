import Link from "next/link";
import { MapPin, Phone, MessageCircle } from "lucide-react";
import type { SiteSettings } from "@/lib/settings";

export function SiteFooter({ settings: st }: { settings: SiteSettings }) {
  return (
    <footer className="mt-12 bg-navy-900 text-white/80 no-print">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/50">Cổng tra cứu tiện ích</p>
          <p className="mt-1 text-lg font-extrabold text-accent">{st.site_name}</p>
          <p className="mt-2 text-sm leading-relaxed">{st.site_tagline}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-white">Liên hệ</p>
          {st.contact_address && (
            <p className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {st.contact_address}
            </p>
          )}
          {st.contact_hotline && (
            <a href={`tel:${st.contact_hotline.replace(/\s/g, "")}`} className="flex gap-2 hover:text-white">
              <Phone className="mt-0.5 h-4 w-4 shrink-0" /> Hotline: {st.contact_hotline}
            </a>
          )}
          {st.contact_zalo && (
            <a
              href={`https://zalo.me/${st.contact_zalo.replace(/\s/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex gap-2 hover:text-white"
            >
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" /> Zalo: {st.contact_zalo}
            </a>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Link href="/danh-muc" className="hover:text-white">Danh mục tiện ích</Link>
          <Link href="/ban-do-hanh-chinh" className="hover:text-white">Tổ dân phố</Link>
          <Link href="/thong-bao" className="hover:text-white">Thông báo</Link>
          <Link href="/de-xuat" className="hover:text-white">Đề xuất / Báo sai</Link>
          <Link href="/lien-he" className="hover:text-white">Liên hệ</Link>
          <Link href="/admin" className="hover:text-white">Đăng nhập quản trị</Link>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Cổng tra cứu tiện ích {st.site_name}
      </div>
    </footer>
  );
}
