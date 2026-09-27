import type { Metadata } from "next";
import { MapPin, MessageCircle, Phone, Mail } from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";
import { EmergencyBox } from "@/components/site/EmergencyBox";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Liên hệ & Giới thiệu" };

export default async function ContactPage() {
  const st = await getSettings();
  const zalo = st.contact_zalo.replace(/\s/g, "");
  return (
    <>
      <PageHeader
        title="Liên hệ & Giới thiệu"
        subtitle="Kết nối với chúng tôi để được hỗ trợ và tìm hiểu thêm về hệ thống tra cứu tiện ích."
        crumbs={[{ label: "Liên hệ" }]}
      />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="text-xl font-extrabold text-slate-800">Thông tin liên hệ</h2>
            <p className="mt-1 text-sm text-slate-500">Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn.</p>
            <div className="mt-5 space-y-3">
              {st.contact_zalo && (
                <Item icon={<MessageCircle className="h-5 w-5" />} label="Zalo hỗ trợ" value={st.contact_zalo} href={`https://zalo.me/${zalo}`} />
              )}
              {st.contact_hotline && (
                <Item icon={<Phone className="h-5 w-5" />} label="Hotline" value={st.contact_hotline} href={`tel:${st.contact_hotline.replace(/\s/g, "")}`} />
              )}
              {st.contact_email && <Item icon={<Mail className="h-5 w-5" />} label="Email" value={st.contact_email} href={`mailto:${st.contact_email}`} />}
              {st.contact_address && <Item icon={<MapPin className="h-5 w-5" />} label="Địa chỉ" value={st.contact_address} />}
            </div>
          </div>
          {st.contact_zalo && (
            <div className="rounded-3xl bg-gradient-to-br from-sky-500 to-blue-700 p-6 text-white shadow-lg">
              <p className="text-lg font-bold">Kết nối qua Zalo</p>
              <p className="mt-1 text-sm text-white/85">Đội ngũ hỗ trợ luôn sẵn sàng giải đáp mọi thắc mắc của bạn qua Zalo.</p>
              <a href={`https://zalo.me/${zalo}`} target="_blank" rel="noreferrer" className="btn mt-4 bg-white text-blue-700 hover:bg-blue-50">
                Chat ngay qua Zalo
              </a>
            </div>
          )}
          <EmergencyBox />
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
          <h2 className="text-xl font-extrabold text-slate-800">Giới thiệu hệ thống</h2>
          <div className="mt-3 whitespace-pre-line leading-relaxed text-slate-700">
            {st.about.replace(/\.(?=[A-ZĐÀ-Ỹ])/g, ".\n\n")}
          </div>
        </div>
      </div>
    </>
  );
}

function Item({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const body = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy-50 text-navy-700">{icon}</span>
      <span>
        <span className="block text-xs text-slate-500">{label}</span>
        <span className="block font-semibold text-slate-800">{value}</span>
      </span>
    </>
  );
  return href ? (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50">{body}</a>
  ) : (
    <div className="flex items-center gap-3 p-2">{body}</div>
  );
}
