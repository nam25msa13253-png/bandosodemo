"""
Làm sạch dữ liệu thô thu thập từ web gốc -> data/seed-data.json

Cách chạy (chỉ cần khi muốn làm lại từ CSV gốc):
    python scripts/clean_data.py <thư_mục_csv>

Các lỗi được xử lý (xem báo cáo phân tích):
  - Mã lĩnh vực không chuẩn  -> snake_case
  - Icon sai (Quán cà phê)    -> Coffee
  - 7 slug trùng              -> 3 cặp nhập trùng gộp lại; 4 cặp khác nhau thêm hậu tố -2
  - SĐT dính 2 số, có dấu cách/chấm -> tách mảng
  - Dân số / số hộ dạng chữ   -> số nguyên
  - Rating không rõ nguồn     -> bỏ
  - Tọa độ lấy từ link Google Maps nếu cột lat/lon trống
  - Lỗi chính tả phổ biến
"""
import csv, json, re, sys, os
from collections import Counter, defaultdict

SRC = sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-data/uploads/hahuytapso_data/csv"
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "seed-data.json")
ASSET = "https://hahuytapso.vn/api/assets?path="


def read(name):
    with open(os.path.join(SRC, name), encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


# ---------- Lĩnh vực ----------
SECTOR_FIX = {
    "co-so-tin-nguong-ton giao": "co_so_tin_nguong_ton_giao",
    "Cho": "cho",
    "SP_OCOP": "san_pham_ocop",
    "linh_vuc_giao_duc": "giao_duc",
}
ICON_FIX = {"quan_ca_phe": "Coffee", "khac": "LayoutGrid", "cho": "ShoppingBasket",
            "co_so_tin_nguong_ton_giao": "Church", "san_pham_ocop": "Award",
            "nguoi_co_cong": "Medal", "di_san": "Landmark", "giao_duc": "GraduationCap",
            "cac_co_quan_don_vi": "Building2"}
NAME_FIX = {"quan_ca_phe": "Quán cà phê - Giải khát"}

sectors = []
for r in read("03_linh_vuc.csv"):
    sid = SECTOR_FIX.get(r["Mã lĩnh vực (id)"], r["Mã lĩnh vực (id)"])
    sectors.append({
        "id": sid,
        "name": NAME_FIX.get(sid, r["Tên lĩnh vực"]),
        "icon": ICON_FIX.get(sid, r["Icon (lucide-react)"]),
        "color": r["Màu (HEX)"].upper(),
        "sortOrder": int(r["Thứ tự"]),
    })


# ---------- Tiện ích ----------
def split_phones(raw):
    if not raw:
        return []
    parts = re.split(r"\s*[-/,;]\s*(?=0)|\s+-\s*", raw)
    out = []
    for p in parts:
        d = re.sub(r"\D", "", p)
        if not d:
            continue
        # 20 chữ số = 2 số di động dính nhau
        if len(d) == 20:
            out += [d[:10], d[10:]]
        else:
            out.append(d)
    return list(dict.fromkeys(out))


def coords_from(*texts):
    for t in texts:
        if not t:
            continue
        m = re.search(r"(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{2,3}\.\d{3,})", t)
        if m:
            return float(m.group(1)), float(m.group(2))
        m = re.search(r"@(-?\d+\.\d+),(-?\d+\.\d+)", t)
        if m:
            return float(m.group(1)), float(m.group(2))
    return None, None


TYPO = {"xăn dầu": "xăng dầu", "Nguỹen XÍ": "Nguyễn Xí", "trách Quốc lộ": "tránh Quốc lộ"}


def fix_typo(s):
    for a, b in TYPO.items():
        s = s.replace(a, b)
    return s


def norm_hours(h):
    h = h.strip()
    h = h.replace("6;00", "6:00").replace("7-00", "7:00").replace("7::00", "7:00")
    return h or None


images_by_slug_idx = defaultdict(list)
rows = read("02_dich_vu.csv")

slug_count = Counter(r["Slug (ID URL)"] for r in rows)
# 3 cặp là nhập trùng cùng 1 cơ sở -> gộp
MERGE_SLUGS = {"cu-do-bao-trang", "nha-xe-phu-quy", "ben-xe-ha-tinh"}

places_by_slug = defaultdict(list)
for r in rows:
    lat = float(r["Vĩ độ (lat)"]) if r["Vĩ độ (lat)"] else None
    lng = float(r["Kinh độ (lon)"]) if r["Kinh độ (lon)"] else None
    if lat is None:
        lat, lng = coords_from(r["Vị trí (trường location)"], r["Link vị trí (location_url)"])
    loc_url = r["Link vị trí (location_url)"].strip() or None
    if loc_url and not loc_url.startswith("http"):
        loc_url = None  # chỉ là toạ độ thô
    imgs = [ASSET + p.strip().replace("/", "%2F") for p in r["Tất cả ảnh (đường dẫn gốc, | phân cách)"].split("|") if p.strip()]
    sid = SECTOR_FIX.get(r["Mã lĩnh vực"], r["Mã lĩnh vực"])
    desc = fix_typo(r["Ghi chú / Mô tả"].strip()) or None
    p = {
        "legacySlug": r["Slug (ID URL)"],
        "name": fix_typo(r["Tên cơ sở"].strip()),
        "sectorId": sid,
        "villageCode": int(r["STT Tổ dân phố"]) if r["STT Tổ dân phố"] else None,
        "phones": split_phones(r["Số điện thoại (gốc)"]),
        "openingHours": norm_hours(r["Giờ hoạt động"]),
        "lat": lat, "lng": lng,
        "locationUrl": loc_url,
        "description": desc,
        "images": imgs,
        "website": r["Website"].strip() or None,
        "order": int(r["STT"]),
    }
    places_by_slug[p["legacySlug"]].append(p)

places = []
redirects = []
merged_report, suffixed_report = [], []
for slug, group in places_by_slug.items():
    if len(group) == 1:
        g = group[0]
        g["slug"] = slug
        places.append(g)
        continue
    if slug in MERGE_SLUGS:
        # giữ bản có tọa độ, gộp SĐT/ảnh/mô tả
        group.sort(key=lambda x: (x["lat"] is None, -len(x["images"])))
        keep = dict(group[0])
        for o in group[1:]:
            keep["phones"] = list(dict.fromkeys(keep["phones"] + o["phones"]))
            keep["images"] = list(dict.fromkeys(keep["images"] + o["images"]))
            keep["description"] = keep["description"] or o["description"]
            keep["openingHours"] = keep["openingHours"] or o["openingHours"]
            keep["locationUrl"] = keep["locationUrl"] or o["locationUrl"]
        keep["slug"] = slug
        places.append(keep)
        merged_report.append(slug)
    else:
        group.sort(key=lambda x: x["order"])
        for i, g in enumerate(group):
            g["slug"] = slug if i == 0 else f"{slug}-{i + 1}"
            places.append(g)
        suffixed_report.append(slug)

places.sort(key=lambda x: x["order"])
for p in places:
    p.pop("order", None)
    p.pop("legacySlug", None)


# ---------- Tổ dân phố ----------
def to_int(s):
    d = re.sub(r"[^\d]", "", s or "")
    return int(d) if d else None


villages = []
for r in read("04_to_dan_pho.csv"):
    poly = None
    if r["Polygon (x%,y% trên ảnh bản đồ)"].strip():
        poly = [[float(a) for a in pt.split(",")] for pt in r["Polygon (x%,y% trên ảnh bản đồ)"].split(";") if pt.strip()]
    imgs = [u for u in r["Ảnh (URL)"].split("|") if u.strip()] if r["Ảnh (URL)"] else []
    code = int(r["STT"])
    villages.append({
        "code": code,
        "name": r["Tên mới"].strip(),
        "slug": f"to-dan-pho-{code}",
        "mergedFrom": fix_typo(r["Sáp nhập từ"].strip().rstrip(",").strip()) or None,
        "areaHa": float(r["Diện tích (ha)"]) if r["Diện tích (ha)"].strip() else None,
        "population": to_int(r["Dân số (người)"]),
        "households": to_int(r["Số hộ (nếu có)"]),
        "secretaryName": r["Bí thư chi bộ"].strip() or None,
        "secretaryPhone": r["SĐT Bí thư chi bộ"].strip() or None,
        "leaderName": r["Tổ trưởng"].strip() or None,
        "leaderPhone": r["SĐT Tổ trưởng"].strip() or None,
        "frontHeadName": r["Trưởng ban CTMT"].strip() or None,
        "frontHeadPhone": r["SĐT Trưởng ban CTMT"].strip() or None,
        "note": r["Ghi chú"].strip() or None,
        "locationUrl": r["location_url"].strip() or None,
        "images": [i.strip() for i in imgs],
        "polygon": poly,
    })

# ---------- Cơ quan, khẩn cấp, liên hệ, cấu hình ----------
agencies = []
for r in read("08_co_quan.csv"):
    agencies.append({
        "name": r["Tên đơn vị"].replace("Ủy ban Nhân dân xã", "Ủy ban nhân dân phường"),
        "logo": r["Logo (URL)"] or None,
        "locationUrl": r["Link vị trí"] or None,
        "sortOrder": int(r["Thứ tự"]),
    })

emergency = []
for i, r in enumerate(read("09_khan_cap.csv")):
    c = r["Màu hiển thị"]
    emergency.append({"name": r["Tên"], "phone": r["Số điện thoại"], "color": c if c.startswith("#") else None, "sortOrder": i + 1})
# Bổ sung 113 (web gốc thiếu)
emergency.insert(0, {"name": "Cảnh sát 113", "phone": "113", "color": "#e11d48", "sortOrder": 0})

contact = {r["Mục"]: r["Giá trị"] for r in read("10_lien_he.csv")}
cfg = {r["Khóa cấu hình"]: (r["URL (nếu là ảnh)"] or r["Giá trị"]) for r in read("11_cau_hinh.csv")}

# Tâm bản đồ = trung bình tọa độ
lats = [p["lat"] for p in places if p["lat"]]
lngs = [p["lng"] for p in places if p["lng"]]

settings = {
    "site_name": "PHƯỜNG HÀ HUY TẬP",
    "site_short": "Hà Huy Tập",
    "site_tagline": "Bản đồ số – Tra cứu thông tin tổ dân phố và dịch vụ tiện ích trong một chạm",
    "meta_title": "Phường Hà Huy Tập 4.0 - Tra cứu thông tin Tổ dân phố và các dịch vụ tiện ích",
    "meta_description": "Tra cứu tổ dân phố, cán bộ, cơ sở dịch vụ, tiện ích trên địa bàn phường Hà Huy Tập, tỉnh Hà Tĩnh: bản đồ số, chỉ đường, gọi điện trong một chạm.",
    "logo_url": ASSET + "ha-huy-tap%2Flogohahuytap_1783503709027.png",
    "banner_url": cfg.get("logo_url", ""),
    "admin_map_url": cfg.get("map_url", ""),
    "search_placeholder": "Nhập tên cơ sở, dịch vụ, tổ dân phố, tên cán bộ...",
    "unit_name": "Tổ dân phố",
    "map_center_lat": str(round(sum(lats) / len(lats), 6)),
    "map_center_lng": str(round(sum(lngs) / len(lngs), 6)),
    "map_zoom": "14",
    "weather_place": "Hà Tĩnh",
    "contact_zalo": contact.get("Zalo hỗ trợ", ""),
    "contact_hotline": contact.get("Hotline", ""),
    # Từ 01/7/2025 bỏ cấp huyện -> không còn "Thành phố Hà Tĩnh"
    "contact_address": "Phường Hà Huy Tập, Tỉnh Hà Tĩnh",
    "contact_email": "",
    "about": contact.get("Giới thiệu hệ thống", ""),
    "allow_submissions": "true",
    "show_official_phones": "true",
}

data = {
    "sectors": sectors,
    "villages": villages,
    "places": places,
    "agencies": agencies,
    "emergency": emergency,
    "settings": settings,
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=1)

print(f"Lĩnh vực: {len(sectors)} | Tổ: {len(villages)} | Cơ sở: {len(places)} (gốc {len(rows)})")
print("Gộp trùng:", merged_report)
print("Thêm hậu tố:", suffixed_report)
print("Không toạ độ:", sum(1 for p in places if p["lat"] is None))
print("Nhiều SĐT:", sum(1 for p in places if len(p["phones"]) > 1))
bad = [ph for p in places for ph in p["phones"] if len(ph) not in (10, 11) or (len(ph) == 11 and not ph.startswith("02"))]
print("SĐT nghi sai:", bad)
