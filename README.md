# Bản đồ số – Tra cứu tiện ích cấp phường

Web tra cứu tổ dân phố và dịch vụ tiện ích, xây dựng tương tự hahuytapso.vn, đã nạp sẵn dữ liệu thu thập ngày 25/09/2026 (505 cơ sở, 18 lĩnh vực, 13 tổ dân phố).

**Công nghệ:** Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · PostgreSQL 16 (Drizzle ORM) · MapLibre GL · Open‑Meteo · lucide-react

---

## 1. Chạy thử trên máy tính (Windows)

### Cài đặt 1 lần

1. **Node.js 22 LTS** – tải tại https://nodejs.org → chọn bản LTS → cài mặc định.
2. **Docker Desktop** – tải tại https://www.docker.com/products/docker-desktop → cài xong mở lên một lần để nó chạy nền.
   (Không muốn dùng Docker thì cài PostgreSQL 16 bản thường, tạo user `bandoso` / mật khẩu `bandoso` / database `bandoso`.)

### Chạy web

Mở thư mục dự án → bấm vào thanh địa chỉ của File Explorer → gõ `cmd` → Enter, rồi chạy lần lượt:

```bash
copy .env.example .env          # tạo file cấu hình (chỉ lần đầu)
docker compose up -d db         # bật cơ sở dữ liệu
npm install                     # tải thư viện (chỉ lần đầu, ~2 phút)
npm run setup                   # tạo bảng + nạp dữ liệu (chỉ lần đầu; chạy lại không ghi đè dữ liệu đã sửa)
npm run dev                     # chạy web
```

Mở trình duyệt: **http://localhost:3000**

- Trang quản trị: **http://localhost:3000/admin** – tài khoản `admin` / `Admin@123456` (đổi ngay trong mục *Tài khoản*).
- Những lần sau chỉ cần: `docker compose up -d db` rồi `npm run dev`.

### Tải ảnh về máy (nên làm 1 lần)

Dữ liệu gốc đang trỏ ảnh về máy chủ hahuytapso.vn. Chạy lệnh sau để tải toàn bộ ảnh về thư mục `uploads/` và đổi link sang ảnh nội bộ (nếu không, web sẽ mất ảnh khi web gốc đổi/xoá ảnh):

```bash
npm run images:download
```

---

## 2. Các trang đã có

| Trang | Đường dẫn | Chức năng |
|---|---|---|
| Bản đồ số (trang chủ) | `/` | Ô tìm kiếm 2 chế độ + gợi ý khi gõ; lọc lĩnh vực; lọc nhanh Gần tôi / Đã xác minh / Đang mở cửa / bán kính; bản đồ gom cụm điểm; danh sách tiện ích gần bạn (khoảng cách thật); thông báo; thời tiết; gọi khẩn cấp; cơ quan |
| Danh mục | `/danh-muc` | Lọc lĩnh vực, tổ, xác minh, mở cửa, khoảng cách; sắp xếp; phân trang |
| Chi tiết cơ sở | `/dich-vu/[slug]` | Ảnh, giờ + trạng thái mở/đóng, Gọi (chọn số nếu nhiều số), Chỉ đường, Chia sẻ, bản đồ, mã QR tải về, in tem QR, cơ sở cùng loại gần đây, báo sai |
| Tổ dân phố | `/ban-do-hanh-chinh`, `/to-dan-pho/[slug]` | Ảnh bản đồ hành chính + ranh giới tổ, danh sách tổ, cán bộ (nút gọi), cơ sở trên địa bàn, thông báo của tổ |
| Thông báo | `/thong-bao` | Lọc theo tổ, tìm kiếm, ghim, hẹn giờ đăng, tự hết hạn |
| Tìm kiếm | `/tim-kiem` | Tìm hợp nhất tổ + cán bộ + cơ sở + thông báo (không cần gõ dấu) |
| Đề xuất / Báo sai | `/de-xuat` | Người dân gửi cơ sở mới hoặc báo sai, chấm vị trí trên bản đồ; chống spam (5 lần/giờ) |
| Liên hệ | `/lien-he` | Zalo, hotline, địa chỉ, giới thiệu |
| In tem QR | `/in-qr/[slug]` | Tem khổ A6 để dán tại cơ sở |

### Trang quản trị `/admin`

- **2 vai trò:** *Quản trị phường* (toàn quyền) và *Cán bộ tổ dân phố* (chỉ thấy/sửa cơ sở, thông báo của tổ mình – kiểm tra ở máy chủ, không chỉ ẩn nút).
- **Tổng quan:** số cơ sở, tỉ lệ đã xác minh, dữ liệu còn thiếu (bấm để mở danh sách cần xử lý), lượt gọi / chỉ đường / chia sẻ 30 ngày, cơ sở xem nhiều.
- **Cơ sở dịch vụ:** thêm/sửa/xoá, tải ảnh, dán link Google Maps (kể cả link rút gọn `maps.app.goo.gl`) để tự lấy toạ độ, chấm vị trí trên bản đồ, kiểm tra giờ hoạt động có đọc được không, xác minh nhanh, xuất CSV mở bằng Excel.
- **Đóng góp người dân:** hàng chờ duyệt, cảnh báo quá hạn 3 ngày, tạo cơ sở từ đề xuất bằng 1 nút.
- **Thông báo, Tổ dân phố (vẽ ranh giới trên ảnh), Lĩnh vực (icon, màu), Cấu hình trang, Tài khoản, Nhật ký thay đổi.**
- Khoá tài khoản 15 phút sau 5 lần nhập sai mật khẩu.

---

## 3. Dữ liệu đã được làm sạch

Script `scripts/clean_data.py` chuyển CSV gốc → `data/seed-data.json`:

- 7 slug trùng: 3 cặp nhập trùng (Bến xe Hà Tĩnh, Cu đơ Bảo Trang, Nhà xe Phú Quý) → gộp; 4 cặp khác nhau → thêm hậu tố `-2`. Vì vậy còn **505** cơ sở thay vì 508.
- 14 ô SĐT dính 2 số → tách thành danh sách số; bỏ dấu cách/chấm.
- Mã lĩnh vực chuẩn hoá (`Cho` → `cho`, `SP_OCOP` → `san_pham_ocop`...), sửa icon Quán cà phê.
- Dân số, số hộ → số nguyên. Sửa chính tả "xăn dầu", "trách Quốc lộ", "Nguỹen XÍ".
- **Không chuyển điểm đánh giá (rating)** vì web gốc không có cơ chế chấm điểm rõ nguồn gốc.
- **Mọi cơ sở để "Chưa xác minh"** – web gốc gắn nhãn "Đã xác minh" không có căn cứ. Cán bộ xác minh dần trong trang quản trị.
- Địa chỉ liên hệ sửa thành "Phường Hà Huy Tập, Tỉnh Hà Tĩnh" (đã bỏ cấp huyện/thành phố từ 01/7/2025).
- 15 cơ sở chỉ có link rút gọn, chưa có toạ độ → mở từng cơ sở trong quản trị, bấm nút ✨ cạnh ô link để lấy toạ độ.

Giờ hoạt động: bộ đọc tự động hiểu được ~98% cách viết trong dữ liệu gốc ("7:00-22:00", "7h30 - 17h30", "24/24", "Giờ hành chính"...), dùng cho bộ lọc "Đang mở cửa".

---

## 4. Đưa lên mạng (máy chủ VPS có Docker)

```bash
# trên VPS, trong thư mục dự án
cp .env.example .env    # sửa AUTH_SECRET, ADMIN_PASSWORD, NEXT_PUBLIC_SITE_URL=https://ten-mien-cua-ban
docker compose --env-file .env up -d --build
```

Sau đó trỏ tên miền về VPS và đặt Nginx/Caddy làm HTTPS phía trước cổng 3000. Ảnh tải lên nằm trong volume `bandoso-uploads`, CSDL trong `bandoso-data` – nhớ sao lưu định kỳ (`docker exec bandoso-db pg_dump -U bandoso bandoso > backup.sql`).

## 4b. Đưa lên Render (miễn phí, không cần VPS)

Repo đã có sẵn file `render.yaml` (Blueprint) tạo 1 web + 1 CSDL PostgreSQL:

1. Đăng nhập https://dashboard.render.com bằng tài khoản GitHub.
2. **New → Blueprint** → chọn repo này → Render đọc `render.yaml`.
3. Bấm **Apply**. Mật khẩu trang quản trị do Render tự sinh: vào service → tab **Environment** → biến `ADMIN_PASSWORD` (tài khoản `admin`).
4. Chờ build xong (~5 phút), mở `https://<tên-service>.onrender.com`.

Lưu ý gói miễn phí của Render:
- Web "ngủ" sau ~15 phút không có người truy cập, lần mở đầu tiên chờ 30–60 giây.
- CSDL miễn phí có thời hạn sử dụng (xem thông báo trên Render) – muốn chạy lâu dài cần nâng gói trả phí.
- Ổ đĩa không lưu lâu dài: **ảnh tải lên trong trang quản trị sẽ mất khi web khởi động lại**. Khi chạy thật cần gói có Persistent Disk hoặc chuyển ảnh sang dịch vụ lưu trữ riêng (Cloudinary, S3...).
- Mỗi lần khởi động, web tự tạo bảng và chỉ nạp dữ liệu mẫu khi CSDL còn trống – không ghi đè dữ liệu đã sửa.

## 5. Bản đồ nền

- Mặc định dùng **OpenFreeMap** – miễn phí, không cần đăng ký.
- Muốn địa danh tiếng Việt chi tiết hơn (giống web gốc): đăng ký khoá **Goong Maptiles** tại https://account.goong.io, điền vào `NEXT_PUBLIC_GOONG_MAPTILES_KEY` trong `.env`, rồi build/chạy lại.

## 6. Cấu trúc thư mục

```
data/seed-data.json        Dữ liệu đã làm sạch
scripts/clean_data.py      Làm sạch CSV gốc -> seed-data.json
scripts/seed.ts            Nạp dữ liệu vào CSDL (npm run db:seed)
scripts/download-images.ts Tải ảnh ngoài về máy
src/db/schema.ts           Thiết kế CSDL (11 bảng)
src/lib/                   Truy vấn, tìm kiếm không dấu, giờ mở cửa, đăng nhập
src/app/(site)/            Các trang công khai
src/app/admin/             Trang quản trị
src/app/api/               API: /api/places, /api/search, /api/events, /api/files, /api/admin/export
src/components/            Giao diện dùng chung (bản đồ, thẻ cơ sở, form...)
```

## 7. Giới hạn hiện tại (chưa làm)

- Ranh giới tổ vẫn vẽ theo % trên ảnh tĩnh như web gốc, chưa phải toạ độ GIS thật → chưa có chức năng "Tôi đang ở tổ nào". Cơ sở dữ liệu dùng image PostGIS nên có thể nâng cấp sau.
- Chưa có đăng nhập 2 lớp (OTP), gửi thông báo qua Zalo OA, nhập Excel hàng loạt, nhiều phường trên 1 hệ thống.
- Chưa có CAPTCHA cho form đề xuất (đang chặn bằng trường ẩn + giới hạn 5 lần/giờ/IP).
