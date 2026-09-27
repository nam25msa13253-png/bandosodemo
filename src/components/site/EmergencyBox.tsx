import { Siren } from "lucide-react";
import { getEmergency } from "@/lib/settings";

export async function EmergencyBox() {
  const list = await getEmergency();
  if (!list.length) return null;
  return (
    <div className="card p-4">
      <p className="flex items-center gap-2 font-bold text-slate-800">
        <Siren className="h-5 w-5 text-emergency" /> Liên hệ khẩn cấp
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {list.map((e) => (
          <a
            key={e.id}
            href={`tel:${e.phone}`}
            className="rounded-xl px-3 py-2.5 text-white shadow-sm transition hover:brightness-110"
            style={{ background: e.color || "#0f3460" }}
          >
            <span className="block text-[11px] font-medium leading-tight opacity-90">{e.name}</span>
            <span className={`block font-extrabold leading-tight ${e.phone.length > 5 ? "text-[15px]" : "text-xl"}`}>{e.phone}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
