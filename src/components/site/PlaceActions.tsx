"use client";
import { useState } from "react";
import { Navigation, Phone, Share2, Check } from "lucide-react";
import { track } from "./TrackLink";
import { formatPhone } from "@/lib/text";

export function PlaceActions({ placeId, name, phones, directions, url, inactive }: {
  placeId: string; name: string; phones: string[]; directions: string | null; url: string; inactive?: boolean;
}) {
  const [showPhones, setShowPhones] = useState(false);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    track(placeId, "share");
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="relative">
        {phones.length > 0 && !inactive ? (
          phones.length === 1 ? (
            <a href={`tel:${phones[0]}`} onClick={() => track(placeId, "call")} className="btn btn-green h-12 w-full text-base">
              <Phone className="h-5 w-5" /> Gọi
            </a>
          ) : (
            <button onClick={() => setShowPhones((v) => !v)} className="btn btn-green h-12 w-full text-base">
              <Phone className="h-5 w-5" /> Gọi ({phones.length})
            </button>
          )
        ) : (
          <button disabled className="btn h-12 w-full bg-slate-100 text-slate-400">
            <Phone className="h-5 w-5" /> Gọi
          </button>
        )}
        {showPhones && (
          <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
            {phones.map((p) => (
              <a key={p} href={`tel:${p}`} onClick={() => track(placeId, "call")} className="flex items-center gap-2 rounded-lg px-3 py-2.5 font-semibold text-emerald-700 hover:bg-emerald-50">
                <Phone className="h-4 w-4" /> {formatPhone(p)}
              </a>
            ))}
          </div>
        )}
      </div>
      {directions ? (
        <a href={directions} target="_blank" rel="noreferrer" onClick={() => track(placeId, "direction")} className="btn btn-accent h-12 text-base">
          <Navigation className="h-5 w-5" /> Chỉ đường
        </a>
      ) : (
        <button disabled className="btn h-12 bg-slate-100 text-slate-400">
          <Navigation className="h-5 w-5" /> Chỉ đường
        </button>
      )}
      <button onClick={share} className="btn btn-primary h-12 text-base">
        {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />} {copied ? "Đã chép" : "Chia sẻ"}
      </button>
    </div>
  );
}
