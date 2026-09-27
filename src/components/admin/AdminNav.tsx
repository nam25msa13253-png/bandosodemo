"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Store, Users, Layers, Megaphone, Inbox, Settings, UserRound, History } from "lucide-react";

const ITEMS = [
  { href: "/admin", label: "Tổng quan", Icon: LayoutDashboard, admin: false },
  { href: "/admin/co-so", label: "Cơ sở dịch vụ", Icon: Store, admin: false },
  { href: "/admin/dong-gop", label: "Đóng góp người dân", Icon: Inbox, admin: false, badge: true },
  { href: "/admin/thong-bao", label: "Thông báo", Icon: Megaphone, admin: false },
  { href: "/admin/to-dan-pho", label: "Tổ dân phố", Icon: Users, admin: false },
  { href: "/admin/linh-vuc", label: "Lĩnh vực", Icon: Layers, admin: true },
  { href: "/admin/cau-hinh", label: "Cấu hình trang", Icon: Settings, admin: true },
  { href: "/admin/tai-khoan", label: "Tài khoản", Icon: UserRound, admin: false },
  { href: "/admin/nhat-ky", label: "Nhật ký thay đổi", Icon: History, admin: true },
];

export function AdminNav({ isAdmin, pending }: { isAdmin: boolean; pending: number }) {
  const path = usePathname();
  return (
    <nav className="space-y-0.5">
      {ITEMS.filter((i) => isAdmin || !i.admin).map(({ href, label, Icon, badge }) => {
        const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium ${
              active ? "bg-white/15 text-accent" : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
            <span className="flex-1">{label}</span>
            {badge && pending > 0 && <span className="rounded-full bg-rose-500 px-1.5 text-xs font-bold text-white">{pending}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
