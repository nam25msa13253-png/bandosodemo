import { Plus, Save, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAgencies, getEmergency, getSettings } from "@/lib/settings";
import { AdminTitle, Flash } from "@/components/admin/ui";
import { saveAgency, saveEmergency, saveSettings } from "./actions";

export default async function AdminSettings({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  await requireAdmin();
  const { msg, err } = await searchParams;
  const [st, emergency, agencies] = await Promise.all([getSettings(), getEmergency(), getAgencies()]);
  const F = ({ k, label, hint, area }: { k: string; label: string; hint?: string; area?: boolean }) => (
    <div>
      <label className="label">{label}</label>
      {area ? <textarea name={k} rows={5} defaultValue={st[k]} className="input" /> : <input name={k} defaultValue={st[k]} className="input" />}
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
  const Img = ({ k, label }: { k: string; label: string }) => (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {st[k] && <img src={st[k]} alt="" className="h-10 w-10 rounded-lg border object-cover" />}
        <input name={k} defaultValue={st[k]} className="input font-mono text-xs" />
      </div>
      <input type="file" name={`${k}_file`} accept="image/*" className="mt-1 text-xs" />
    </div>
  );
  return (
    <>
      <AdminTitle title="Cấu hình trang" desc="Tên đơn vị, logo, bản đồ, liên hệ, số khẩn cấp, cơ quan" />
      <Flash msg={msg === "saved" ? "Đã lưu cấu hình." : undefined} err={err} />
      <form action={saveSettings} className="grid gap-4 xl:grid-cols-2">
        <div className="card space-y-3 p-4">
          <p className="font-bold text-slate-800">Nhận diện</p>
          <F k="site_name" label="Tên đơn vị (hiện to ở đầu trang)" />
          <F k="site_short" label="Tên ngắn" />
          <F k="site_tagline" label="Khẩu hiệu / mô tả ngắn" />
          <Img k="logo_url" label="Logo" />
          <Img k="banner_url" label="Ảnh nền đầu trang" />
          <Img k="admin_map_url" label="Ảnh bản đồ hành chính" />
        </div>
        <div className="space-y-4">
          <div className="card space-y-3 p-4">
            <p className="font-bold text-slate-800">Liên hệ</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <F k="contact_hotline" label="Hotline" />
              <F k="contact_zalo" label="Zalo" />
              <F k="contact_email" label="Email" />
              <F k="contact_address" label="Địa chỉ" />
            </div>
            <F k="about" label="Giới thiệu hệ thống" area />
          </div>
          <div className="card space-y-3 p-4">
            <p className="font-bold text-slate-800">Bản đồ, SEO & tuỳ chọn</p>
            <div className="grid grid-cols-3 gap-2">
              <F k="map_center_lat" label="Tâm – vĩ độ" />
              <F k="map_center_lng" label="Tâm – kinh độ" />
              <F k="map_zoom" label="Mức zoom" />
            </div>
            <F k="weather_place" label="Tên địa danh hiển thị thời tiết" />
            <F k="meta_title" label="Tiêu đề SEO" />
            <F k="meta_description" label="Mô tả SEO" />
            <div className="grid gap-3 sm:grid-cols-2">
              <F k="unit_name" label="Tên đơn vị cấp dưới" hint="VD: Tổ dân phố / Thôn" />
              <F k="search_placeholder" label="Gợi ý ô tìm kiếm" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="allow_submissions" defaultChecked={st.allow_submissions === "true"} className="h-4 w-4 accent-navy-800" />
              Cho phép người dân gửi đề xuất / báo sai
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="show_official_phones" defaultChecked={st.show_official_phones !== "false"} className="h-4 w-4 accent-navy-800" />
              Công khai số điện thoại cán bộ tổ dân phố
            </label>
          </div>
          <button className="btn btn-primary h-12 w-full"><Save className="h-5 w-5" /> Lưu cấu hình</button>
        </div>
      </form>

      <div id="khan-cap" className="card mt-6 p-4">
        <p className="font-bold text-slate-800">Số điện thoại khẩn cấp</p>
        <div className="mt-3 space-y-2">
          {[...emergency, null].map((e, i) => (
            <form key={e?.id ?? "new"} action={saveEmergency} className="grid items-center gap-2 sm:grid-cols-[1fr_160px_70px_70px_auto_auto]">
              {e && <input type="hidden" name="id" value={e.id} />}
              <input name="name" defaultValue={e?.name} placeholder="Tên (VD: Công an phường)" className="input" required />
              <input name="phone" defaultValue={e?.phone} placeholder="Số điện thoại" className="input" required />
              <input type="color" name="color" defaultValue={e?.color ?? "#0f3460"} className="h-10 w-full rounded-xl border border-slate-300" />
              <input type="number" name="sortOrder" defaultValue={e?.sortOrder ?? i} className="input" title="Thứ tự" />
              <button className="btn btn-primary px-3">{e ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</button>
              {e ? <button name="delete" value="1" formNoValidate className="btn btn-outline px-3 text-rose-600"><Trash2 className="h-4 w-4" /></button> : <span />}
            </form>
          ))}
        </div>
      </div>

      <div id="co-quan" className="card mt-6 p-4">
        <p className="font-bold text-slate-800">Cơ quan, đơn vị</p>
        <div className="mt-3 space-y-3">
          {[...agencies, null].map((a, i) => (
            <form key={a?.id ?? "new"} action={saveAgency} className="grid items-center gap-2 rounded-xl border border-slate-100 p-2 lg:grid-cols-[1fr_1fr_1fr_70px_auto_auto]">
              {a && <input type="hidden" name="id" value={a.id} />}
              <input name="name" defaultValue={a?.name} placeholder="Tên cơ quan" className="input" required />
              <input name="locationUrl" defaultValue={a?.locationUrl ?? ""} placeholder="Link vị trí" className="input" />
              <div>
                <input name="logo" defaultValue={a?.logo ?? ""} placeholder="Link logo" className="input text-xs" />
                <input type="file" name="logoFile" accept="image/*" className="mt-1 text-xs" />
              </div>
              <input type="number" name="sortOrder" defaultValue={a?.sortOrder ?? i + 1} className="input" />
              <button className="btn btn-primary px-3">{a ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</button>
              {a ? <button name="delete" value="1" formNoValidate className="btn btn-outline px-3 text-rose-600"><Trash2 className="h-4 w-4" /></button> : <span />}
            </form>
          ))}
        </div>
      </div>
    </>
  );
}
