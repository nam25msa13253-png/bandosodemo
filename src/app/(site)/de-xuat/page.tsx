import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { PageHeader } from "@/components/site/PageHeader";
import { getSectors, getSettings } from "@/lib/settings";
import { SuggestForm } from "./SuggestForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Đề xuất cơ sở / Báo sai thông tin" };

export default async function SuggestPage({ searchParams }: { searchParams: Promise<{ place?: string; type?: string }> }) {
  const sp = await searchParams;
  const [st, sectors] = await Promise.all([getSettings(), getSectors()]);
  const place = sp.place
    ? await db.query.places.findFirst({ where: eq(s.places.slug, sp.place), columns: { slug: true, name: true, lat: true, lng: true } })
    : null;
  const center: [number, number] =
    place?.lat != null && place.lng != null ? [place.lat, place.lng] : [Number(st.map_center_lat), Number(st.map_center_lng)];
  return (
    <>
      <PageHeader
        title={place ? "Báo sai thông tin" : "Đề xuất cơ sở mới / Báo sai"}
        subtitle="Đề xuất sẽ được cán bộ phường kiểm tra trước khi cập nhật lên hệ thống."
        crumbs={[{ label: "Đề xuất" }]}
      />
      <div className="mx-auto max-w-2xl px-4 py-6">
        {st.allow_submissions === "true" ? (
          <SuggestForm
            place={place ? { slug: place.slug, name: place.name } : null}
            sectors={sectors.map((x) => ({ id: x.id, name: x.name }))}
            center={center}
            defaultType={sp.type}
          />
        ) : (
          <p className="card p-6 text-center text-slate-600">Chức năng đề xuất đang tạm đóng.</p>
        )}
      </div>
    </>
  );
}
