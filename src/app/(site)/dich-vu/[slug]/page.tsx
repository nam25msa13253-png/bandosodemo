import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { BadgeCheck, Clock, ExternalLink, Flag, Globe, MapPin, Phone, Users, Info } from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";
import { PlaceActions } from "@/components/site/PlaceActions";
import { QRBox } from "@/components/site/QRBox";
import { ViewTracker } from "@/components/site/ViewTracker";
import { Gallery } from "@/components/site/Gallery";
import { OpenBadge } from "@/components/site/OpenBadge";
import { PlaceCard } from "@/components/site/PlaceCard";
import { LazyMap } from "@/components/map/LazyMap";
import { SectorIcon } from "@/components/SectorIcon";
import { getPlaceBySlug, listPlaces, sectorCounts } from "@/lib/queries";
import { getSectors, getSettings, siteUrl } from "@/lib/settings";
import { directionsUrl } from "@/lib/geo";
import { openState } from "@/lib/hours";
import { formatDate, formatPhone } from "@/lib/text";

export const dynamic = "force-dynamic";
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const { place } = await getPlaceBySlug(slug);
  if (!place) return { title: "Không tìm thấy cơ sở" };
  const phone = place.phones[0] ? formatPhone(place.phones[0]) : "—";
  return {
    title: `${place.name} - SĐT: ${phone}`,
    description: `${place.name} (${place.sector.name}${place.village ? `, ${place.village.name}` : ""}). SĐT: ${phone}. Giờ hoạt động: ${place.openingHours || "chưa cập nhật"}. ${place.description ?? ""}`.slice(0, 300),
    openGraph: { images: place.images[0] ? [place.images[0]] : undefined },
    alternates: { canonical: `/dich-vu/${place.slug}` },
  };
}

export default async function PlaceDetail({ params }: { params: Params }) {
  const { slug } = await params;
  const { place, redirectTo } = await getPlaceBySlug(slug);
  if (!place) {
    if (redirectTo) permanentRedirect(`/dich-vu/${redirectTo}`);
    notFound();
  }
  if (place.status === "HIDDEN") notFound();

  const [st, sectors, counts, nearby] = await Promise.all([
    getSettings(),
    getSectors(),
    sectorCounts(),
    listPlaces({
      sectors: [place.sectorId],
      lat: place.lat,
      lng: place.lng,
      sort: place.lat != null ? "distance" : "relevance",
      pageSize: 5,
    }),
  ]);
  const url = `${siteUrl()}/dich-vu/${place.slug}`;
  const dir = directionsUrl(place);
  const inactive = place.status === "INACTIVE";
  const state = inactive ? "closed" : openState(place.openingHours);
  const center: [number, number] | null = place.lat != null && place.lng != null ? [place.lat, place.lng] : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: place.name,
    telephone: place.phones[0],
    url,
    image: place.images[0],
    description: place.description ?? undefined,
    openingHours: place.openingHours ?? undefined,
    ...(center ? { geo: { "@type": "GeoCoordinates", latitude: center[0], longitude: center[1] } } : {}),
    address: { "@type": "PostalAddress", streetAddress: place.address ?? place.village?.name, addressRegion: st.contact_address },
  };

  return (
    <>
      <ViewTracker placeId={place.id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHeader
        title="Chi tiết dịch vụ tiện ích"
        subtitle="Thông tin cơ sở cung ứng dịch vụ tại địa phương"
        crumbs={[{ href: "/danh-muc", label: "Danh mục" }, { href: `/danh-muc?sector=${place.sectorId}`, label: place.sector.name }, { label: place.name }]}
      />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="card overflow-hidden p-4 md:p-5">
            {place.images.length > 0 && (
              <div className="mb-4">
                <Gallery images={place.images} name={place.name} />
              </div>
            )}
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: place.sector.color }}>
              <SectorIcon name={place.sector.icon} className="h-4 w-4" /> {place.sector.name}
            </p>
            <h2 className="mt-1 text-2xl font-extrabold leading-tight text-slate-900 md:text-3xl">{place.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <OpenBadge state={state} inactive={inactive} />
              {place.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200">
                  <BadgeCheck className="h-3.5 w-3.5" /> Đã xác minh{place.verifiedAt ? ` ${formatDate(place.verifiedAt)}` : ""}
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">Chưa xác minh</span>
              )}
            </div>

            <div className="mt-5">
              <PlaceActions placeId={place.id} name={place.name} phones={place.phones} directions={dir} url={url} inactive={inactive} />
            </div>

            <dl className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-100">
              <Row icon={<Users className="h-4 w-4" />} label="Địa bàn hoạt động">
                {place.village ? (
                  <Link href={`/to-dan-pho/${place.village.slug}`} className="font-semibold text-navy-700 hover:underline">{place.village.name}</Link>
                ) : (
                  "Chưa cập nhật"
                )}
              </Row>
              <Row icon={<MapPin className="h-4 w-4" />} label="Vị trí / Địa chỉ">
                {place.address && <span className="block">{place.address}</span>}
                {center ? (
                  <span className="text-slate-600">Định vị: {center[0].toFixed(6)}, {center[1].toFixed(6)}</span>
                ) : place.locationUrl ? (
                  <a href={place.locationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-navy-700">
                    Mở vị trí trên Google Maps <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  !place.address && "Chưa cập nhật"
                )}
              </Row>
              <Row icon={<Clock className="h-4 w-4" />} label="Thời gian hoạt động">
                {place.openingHours || "Chưa cập nhật"}
              </Row>
              <Row icon={<Phone className="h-4 w-4" />} label="Số điện thoại">
                {place.phones.length
                  ? place.phones.map((p) => (
                      <a key={p} href={`tel:${p}`} className="mr-3 inline-block font-semibold text-emerald-700">{formatPhone(p)}</a>
                    ))
                  : "Chưa cập nhật"}
              </Row>
              {place.website && (
                <Row icon={<Globe className="h-4 w-4" />} label="Website / Mạng xã hội">
                  <a href={place.website} target="_blank" rel="noreferrer nofollow" className="break-all font-semibold text-navy-700">{place.website}</a>
                </Row>
              )}
              <Row icon={<Info className="h-4 w-4" />} label="Giới thiệu">
                <span className="whitespace-pre-line">{place.description || "Chưa có mô tả chi tiết cho cơ sở này."}</span>
              </Row>
            </dl>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>Cập nhật: {formatDate(place.updatedAt)}</span>
              <Link href={`/de-xuat?place=${place.slug}`} className="inline-flex items-center gap-1 font-semibold text-rose-600 hover:underline">
                <Flag className="h-3.5 w-3.5" /> Báo sai thông tin
              </Link>
            </div>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Vị trí trên bản đồ</h3>
              {dir && (
                <a href={dir} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-navy-700">
                  Mở bằng Google Maps <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            <div className="mt-3">
              {center ? (
                <LazyMap
                  className="h-72"
                  center={center}
                  zoom={16}
                  points={[{ id: place.id, slug: place.slug, name: place.name, sectorName: place.sector.name, color: place.sector.color, lat: center[0], lng: center[1], phone: place.phones[0], image: place.images[0] }]}
                />
              ) : (
                <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Cơ sở chưa có toạ độ chính xác.{" "}
                  <Link href={`/de-xuat?place=${place.slug}&type=WRONG_LOCATION`} className="font-semibold text-navy-700">Góp ý vị trí</Link>
                </p>
              )}
            </div>
          </div>

          {nearby.items.filter((p) => p.id !== place.id).length > 0 && (
            <div>
              <h3 className="text-lg font-extrabold text-slate-800">
                {place.sector.name} {center ? "gần đây" : "khác"}
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {nearby.items.filter((p) => p.id !== place.id).slice(0, 4).map((p) => (
                  <PlaceCard key={p.id} p={p} />
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <QRBox url={url} fileName={place.slug} printHref={`/in-qr/${place.slug}`} />
          <div className="card p-4">
            <p className="font-bold text-slate-800">Danh mục dịch vụ tiện ích</p>
            <div className="mt-2 space-y-0.5">
              {sectors.filter((s) => (counts[s.id] ?? 0) > 0).map((s) => (
                <Link key={s.id} href={`/danh-muc?sector=${s.id}`} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 ${s.id === place.sectorId ? "bg-slate-50 font-semibold" : ""}`}>
                  <SectorIcon name={s.icon} className="h-4 w-4" style={{ color: s.color }} />
                  <span className="flex-1">{s.name}</span>
                  <span className="text-xs text-slate-400">{counts[s.id]} cơ sở</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 px-3.5 py-3 sm:grid-cols-[190px_1fr]">
      <dt className="flex items-center gap-2 text-sm font-medium text-slate-500">{icon} {label}</dt>
      <dd className="text-sm text-slate-800">{children}</dd>
    </div>
  );
}
