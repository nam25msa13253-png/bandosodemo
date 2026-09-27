"use client";
import { useFormAction } from "@/lib/use-form-action";
import { useMemo, useState } from "react";
import { Loader2, MapPin, Save, Trash2, Undo2, Wand2 } from "lucide-react";
import { LazyMap } from "../map/LazyMap";
import { savePlace, resolveMapLink, type FormState } from "@/app/admin/(panel)/co-so/actions";
import { parseHours } from "@/lib/hours";

export type PlaceFormData = {
  id?: string;
  slug?: string;
  name?: string;
  sectorId?: string;
  villageId?: number | null;
  phones?: string[];
  openingHours?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  locationUrl?: string | null;
  description?: string | null;
  website?: string | null;
  images?: string[];
  verified?: boolean;
  status?: "ACTIVE" | "INACTIVE" | "HIDDEN";
  featured?: boolean;
  fromSubmission?: string;
};

function describeHours(raw: string) {
  const h = parseHours(raw);
  if (!raw.trim()) return null;
  if (h.kind === "always") return "Hệ thống hiểu: mở cửa 24/24";
  if (h.kind === "unknown") return "Hệ thống chưa hiểu định dạng này → không tính được “Đang mở cửa”. Nên viết dạng 7:00-22:00";
  const f = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
  return `Hệ thống hiểu: ${h.ranges.map(([a, b]) => `${f(a)}–${f(b)}`).join(", ")}${h.weekdaysOnly ? " (thứ 2 – thứ 6)" : " hằng ngày"}`;
}

export function PlaceForm({
  data, sectors, villages, center, isAdmin, lockedVillageId,
}: {
  data: PlaceFormData;
  sectors: { id: string; name: string }[];
  villages: { id: number; name: string }[];
  center: [number, number];
  isAdmin: boolean;
  lockedVillageId?: number | null;
}) {
  const { state, onSubmit, pending } = useFormAction<FormState>(savePlace, null);
  const [lat, setLat] = useState(data.lat?.toString() ?? "");
  const [lng, setLng] = useState(data.lng?.toString() ?? "");
  const [link, setLink] = useState(data.locationUrl ?? "");
  const [hours, setHours] = useState(data.openingHours ?? "");
  const [resolving, setResolving] = useState(false);
  const [linkMsg, setLinkMsg] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const picked = lat && lng && !isNaN(+lat) && !isNaN(+lng) ? { lat: +lat, lng: +lng } : null;
  const hoursHint = useMemo(() => describeHours(hours), [hours]);

  const resolve = async () => {
    setResolving(true);
    setLinkMsg(null);
    const c = await resolveMapLink(link.trim());
    setResolving(false);
    if (c) {
      setLat(String(c.lat));
      setLng(String(c.lng));
      setLinkMsg("Đã lấy được toạ độ từ link.");
    } else setLinkMsg("Không đọc được toạ độ từ link này – hãy chạm lên bản đồ để đặt vị trí.");
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4 xl:grid-cols-[1fr_420px]">
      {data.id && <input type="hidden" name="id" value={data.id} />}
      {data.fromSubmission && <input type="hidden" name="fromSubmission" value={data.fromSubmission} />}
      <div className="space-y-4">
        <div className="card space-y-3 p-4">
          <p className="font-bold text-slate-800">Thông tin chung</p>
          <div>
            <label className="label">Tên cơ sở *</label>
            <input name="name" defaultValue={data.name} required className="input" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Lĩnh vực *</label>
              <select name="sectorId" defaultValue={data.sectorId ?? ""} required className="input">
                <option value="">— Chọn —</option>
                {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tổ dân phố</label>
              <select name="villageId" defaultValue={(lockedVillageId ?? data.villageId) ?? ""} disabled={!isAdmin} className="input disabled:bg-slate-100">
                <option value="">— Chưa gán —</option>
                {villages.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Số điện thoại (mỗi số 1 dòng)</label>
              <textarea name="phones" rows={2} defaultValue={data.phones?.join("\n")} className="input" />
            </div>
            <div>
              <label className="label">Giờ hoạt động</label>
              <input name="openingHours" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="VD: 7:00-22:00 | 24/24 | Giờ hành chính" className="input" />
              {hoursHint && <p className={`mt-1 text-xs ${hoursHint.includes("chưa hiểu") ? "text-amber-700" : "text-emerald-700"}`}>{hoursHint}</p>}
            </div>
          </div>
          <div>
            <label className="label">Địa chỉ</label>
            <input name="address" defaultValue={data.address ?? ""} placeholder="Số nhà, đường..." className="input" />
          </div>
          <div>
            <label className="label">Giới thiệu / mô tả</label>
            <textarea name="description" rows={4} defaultValue={data.description ?? ""} className="input" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Website / Facebook</label>
              <input name="website" defaultValue={data.website ?? ""} className="input" />
            </div>
            <div>
              <label className="label">Đường dẫn (slug)</label>
              <input name="slug" defaultValue={data.slug} placeholder="Tự sinh từ tên" className="input font-mono text-xs" />
              {data.id && <p className="mt-1 text-xs text-slate-500">Đổi slug: link/QR cũ vẫn tự chuyển sang link mới.</p>}
            </div>
          </div>
        </div>

        <div className="card space-y-3 p-4">
          <p className="font-bold text-slate-800">Hình ảnh</p>
          {data.images && data.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {data.images.map((src) => {
                const off = removed.has(src);
                return (
                  <div key={src} className={`relative overflow-hidden rounded-xl border ${off ? "opacity-30" : ""}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="aspect-square w-full bg-slate-100 object-cover" />
                    {!off && <input type="hidden" name="keepImage" value={src} />}
                    <button
                      type="button"
                      onClick={() => setRemoved((r) => { const n = new Set(r); if (n.has(src)) n.delete(src); else n.add(src); return n; })}
                      className="absolute right-1 top-1 rounded-lg bg-white/90 p-1 text-rose-600 shadow"
                      title={off ? "Giữ lại" : "Xoá ảnh"}
                    >
                      {off ? <Undo2 className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <div>
            <label className="label">Tải ảnh mới (JPG/PNG/WEBP, tối đa 5 MB/ảnh)</label>
            <input type="file" name="newImages" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-navy-50 file:px-3 file:py-2 file:font-semibold file:text-navy-700" />
          </div>
          <div>
            <label className="label">Hoặc dán link ảnh (mỗi link 1 dòng)</label>
            <textarea name="imageUrls" rows={2} className="input font-mono text-xs" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card space-y-3 p-4">
          <p className="flex items-center gap-2 font-bold text-slate-800"><MapPin className="h-4 w-4" /> Vị trí</p>
          <div>
            <label className="label">Link Google Maps</label>
            <div className="flex gap-2">
              <input name="locationUrl" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://maps.app.goo.gl/..." className="input" />
              <button type="button" onClick={resolve} disabled={!link || resolving} className="btn btn-outline shrink-0" title="Lấy toạ độ từ link">
                {resolving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              </button>
            </div>
            {linkMsg && <p className="mt-1 text-xs text-slate-600">{linkMsg}</p>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Vĩ độ (lat)</label>
              <input name="lat" value={lat} onChange={(e) => setLat(e.target.value)} className="input" inputMode="decimal" />
            </div>
            <div>
              <label className="label">Kinh độ (lng)</label>
              <input name="lng" value={lng} onChange={(e) => setLng(e.target.value)} className="input" inputMode="decimal" />
            </div>
          </div>
          <LazyMap
            className="h-72"
            points={[]}
            center={picked ? [picked.lat, picked.lng] : center}
            zoom={picked ? 16 : 14}
            pickMode
            picked={picked}
            onPick={(p) => { setLat(String(p.lat)); setLng(String(p.lng)); }}
          />
          <p className="text-xs text-slate-500">Chạm lên bản đồ để đặt / sửa vị trí.</p>
        </div>

        <div className="card space-y-3 p-4">
          <p className="font-bold text-slate-800">Trạng thái</p>
          <select name="status" defaultValue={data.status ?? "ACTIVE"} className="input">
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Ngừng hoạt động (vẫn hiển thị, nhãn xám)</option>
            <option value="HIDDEN">Ẩn khỏi trang công khai</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="verified" defaultChecked={data.verified} className="h-4 w-4 accent-navy-800" />
            Đã xác minh thông tin (cán bộ đã kiểm tra thực tế)
          </label>
          {isAdmin && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="featured" defaultChecked={data.featured} className="h-4 w-4 accent-navy-800" />
              Ưu tiên hiển thị ở trang chủ (nổi bật)
            </label>
          )}
        </div>

        {state?.error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{state.error}</p>}
        <button disabled={pending} className="btn btn-primary h-12 w-full text-base">
          {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} Lưu cơ sở
        </button>
      </div>
    </form>
  );
}
