"use client";
import { useFormAction } from "@/lib/use-form-action";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, LocateFixed } from "lucide-react";
import { LazyMap } from "@/components/map/LazyMap";
import { submitSuggestion, type SubmitState } from "./actions";

const TYPES = [
  { v: "NEW_PLACE", l: "Đề xuất cơ sở mới" },
  { v: "WRONG_PHONE", l: "Sai số điện thoại" },
  { v: "WRONG_HOURS", l: "Sai giờ hoạt động" },
  { v: "WRONG_LOCATION", l: "Sai vị trí" },
  { v: "CLOSED", l: "Cơ sở đã đóng cửa" },
  { v: "OTHER", l: "Khác" },
];

export function SuggestForm({
  place, sectors, center, defaultType,
}: {
  place: { slug: string; name: string } | null;
  sectors: { id: string; name: string }[];
  center: [number, number];
  defaultType?: string;
}) {
  const { state, onSubmit, pending } = useFormAction<SubmitState>(submitSuggestion, null);
  const [type, setType] = useState(defaultType ?? (place ? "WRONG_PHONE" : "NEW_PLACE"));
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);

  if (state?.ok)
    return (
      <div className="card p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
        <p className="mt-3 text-lg font-bold text-slate-800">{state.message}</p>
        <div className="mt-4 flex justify-center gap-2">
          {place && <Link href={`/dich-vu/${place.slug}`} className="btn btn-outline">Quay lại cơ sở</Link>}
          <Link href="/" className="btn btn-primary">Về trang chủ</Link>
        </div>
      </div>
    );

  const needMap = type === "NEW_PLACE" || type === "WRONG_LOCATION";

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5">
      {place && (
        <div className="rounded-xl bg-navy-50 p-3 text-sm">
          Góp ý cho cơ sở: <b className="text-navy-800">{place.name}</b>
          <input type="hidden" name="place" value={place.slug} />
        </div>
      )}
      <input type="text" name="website2" className="hidden" tabIndex={-1} autoComplete="off" />
      <div>
        <p className="label">Loại đề xuất *</p>
        <div className="flex flex-wrap gap-2">
          {TYPES.filter((t) => (place ? t.v !== "NEW_PLACE" : true)).map((t) => (
            <label key={t.v} className={`chip cursor-pointer ${type === t.v ? "border-navy-800 bg-navy-800 text-white" : "border-slate-200 bg-white"}`}>
              <input type="radio" name="type" value={t.v} checked={type === t.v} onChange={() => setType(t.v)} className="sr-only" />
              {t.l}
            </label>
          ))}
        </div>
      </div>

      {type === "NEW_PLACE" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Tên cơ sở *</label>
            <input name="name" required className="input" />
          </div>
          <div>
            <label className="label">Lĩnh vực</label>
            <select name="sectorId" className="input">
              <option value="">— Chọn —</option>
              {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Số điện thoại cơ sở</label>
            <input name="phone" className="input" inputMode="tel" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Địa chỉ</label>
            <input name="address" className="input" />
          </div>
        </div>
      )}

      <div>
        <label className="label">{type === "NEW_PLACE" ? "Mô tả, giờ hoạt động..." : "Thông tin đúng là gì? *"}</label>
        <textarea name="content" rows={4} className="input" placeholder={type === "WRONG_PHONE" ? "VD: Số đúng là 09xx xxx xxx" : ""} />
      </div>

      {needMap && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="label mb-0">Vị trí (chạm lên bản đồ để đánh dấu)</p>
            <button
              type="button"
              className="btn btn-outline py-1 text-xs"
              onClick={() =>
                navigator.geolocation?.getCurrentPosition((p) =>
                  setPos({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6) }),
                )
              }
            >
              <LocateFixed className="h-3.5 w-3.5" /> Vị trí hiện tại
            </button>
          </div>
          <LazyMap className="h-64" points={[]} center={center} zoom={14} pickMode picked={pos} onPick={setPos} />
          <input type="hidden" name="lat" value={pos?.lat ?? ""} />
          <input type="hidden" name="lng" value={pos?.lng ?? ""} />
          {pos && <p className="mt-1 text-xs text-slate-500">Đã chọn: {pos.lat}, {pos.lng}</p>}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Tên người gửi (không bắt buộc)</label>
          <input name="contactName" className="input" />
        </div>
        <div>
          <label className="label">SĐT/Zalo để nhận phản hồi (không bắt buộc)</label>
          <input name="contactPhone" className="input" inputMode="tel" />
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input type="checkbox" name="consent" className="mt-0.5 h-4 w-4 accent-navy-800" />
        Tôi đồng ý để cán bộ phường sử dụng thông tin trên nhằm xác minh và cập nhật dữ liệu.
      </label>
      {state && !state.ok && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{state.message}</p>}
      <button disabled={pending} className="btn btn-primary w-full py-3 text-base">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Gửi đề xuất
      </button>
    </form>
  );
}
