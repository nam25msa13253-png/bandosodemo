import QRCode from "qrcode";
import { notFound } from "next/navigation";
import { getPlaceBySlug } from "@/lib/queries";
import { getSettings, siteUrl } from "@/lib/settings";
import { formatPhone } from "@/lib/text";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "In tem QR", robots: { index: false } };

/** Tem QR khổ A6 để dán tại cơ sở */
export default async function PrintQR({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { place } = await getPlaceBySlug(slug);
  if (!place) notFound();
  const st = await getSettings();
  const url = `${siteUrl()}/dich-vu/${place.slug}`;
  const qr = await QRCode.toDataURL(url, { width: 800, margin: 1, color: { dark: "#0f3460" } });
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 p-4 print:bg-white print:p-0">
      <div className="w-[105mm] rounded-2xl border-4 border-navy-800 bg-white p-5 text-center shadow-xl print:shadow-none">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Cổng tra cứu tiện ích</p>
        <p className="text-lg font-extrabold text-navy-800">{st.site_name}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="QR" className="mx-auto my-3 w-[70mm]" />
        <p className="text-xl font-extrabold leading-tight text-slate-900">{place.name}</p>
        <p className="mt-1 text-sm font-semibold" style={{ color: place.sector.color }}>{place.sector.name}</p>
        {place.phones[0] && <p className="mt-1 text-base font-bold text-slate-700">☎ {formatPhone(place.phones[0])}</p>}
        <p className="mt-3 rounded-lg bg-accent px-2 py-1.5 text-xs font-bold text-slate-900">Quét mã để xem thông tin, gọi điện, chỉ đường</p>
      </div>
      <PrintButton />
    </div>
  );
}
