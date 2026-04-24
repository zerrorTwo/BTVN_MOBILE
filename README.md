# BTVN Mobile — E-commerce Full Stack

Backend Node.js/Express + MySQL + Nodemailer. Frontend React Native (Expo). Tích hợp thanh toán MoMo (sandbox) + email thông báo đơn hàng.

---

## 1. Cấu trúc thư mục

```
BTVN_MOBILE/
├── BE_BTVN/                  # Backend Node.js + TypeScript + Sequelize
│   ├── src/                  # Mã nguồn (route → controller → service → model)
│   ├── seed/
│   │   └── be_btvn.sql       # Dump đầy đủ schema + seed data (200 sản phẩm + 2 user)
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example          # Mẫu ENV cho chạy không Docker (Gmail + MySQL local)
│   └── package.json
│
├── BT01/                     # Frontend React Native (Expo)
│   ├── src/
│   │   ├── screens/          # UI screens
│   │   ├── components/       # Reusable (OrderCard, Skeleton, Toast, EmptyState…)
│   │   ├── services/api/     # RTK Query
│   │   ├── store/            # Redux store + authSlice
│   │   ├── theme/            # colors, payment meta, typography, shadows
│   │   ├── types/
│   │   └── navigation/
│   ├── .env.example
│   └── package.json
│
├── docker-compose.yml        # mysql + mailpit + backend
├── .env.docker.example       # Override cho compose (thường chỉ cần MoMo IPN URL)
├── laptops.json              # Seed data (dùng cho seeder nếu DB rỗng)
├── laptops2.json             # Seed data (phụ kiện)
└── README.md                 # File này
```

---

## 2. Các file bắt buộc phải có để chạy Docker

| File | Mục đích |
|---|---|
| `docker-compose.yml` | Khai báo 3 service: `mysql`, `mailpit`, `backend` |
| `BE_BTVN/Dockerfile` | Build image backend (multi-stage: build → runtime) |
| `BE_BTVN/.dockerignore` | Loại trừ `node_modules`, `dist`, `.env`, file test khỏi build context |
| `BE_BTVN/package.json` + `package-lock.json` + `tsconfig.json` + `src/` | Mã nguồn backend |
| `BE_BTVN/seed/be_btvn.sql` | **SQL dump** — auto-import vào MySQL khi khởi tạo DB lần đầu |
| `laptops.json` + `laptops2.json` | Fallback seed: chỉ dùng khi DB trống và không import SQL (seeder code chạy) |

Không bắt buộc:
- `.env.docker` hoặc copy từ `.env.docker.example` nếu muốn override MoMo IPN URL.

---

## 3. Chạy bằng Docker (khuyến nghị)

### Yêu cầu
- **Docker Desktop** (Windows/macOS) hoặc Docker Engine + Docker Compose v2 (Linux).
- Cổng trống: `5000` (backend), `3307` (MySQL host mapping), `1025` (SMTP), `8025` (Mailpit UI).

### Khởi động

Từ thư mục gốc `BTVN_MOBILE/`:

```bash
docker compose up -d --build
```

Kiểm tra log:

```bash
docker compose logs -f backend
```

Log thành công trông như:
```
Database connection established successfully.
ℹ️ Data already exists. Skipping seed.   # (SQL dump đã có sẵn products)
✅ Email service connected via SMTP mailpit:1025
Server is running on port 5000
```

### Điểm truy cập

| URL | Mô tả |
|---|---|
| http://localhost:5000 | Backend API (GET /) |
| http://localhost:5000/api/v1/products | REST API danh sách sản phẩm |
| http://localhost:8025 | **Mailpit UI** — xem email test (OTP, xác nhận đơn, giao hàng) |
| `localhost:3307` | MySQL (user: `be_user`, pass: `be_pass`, db: `be_btvn`) |

### Tài khoản demo (có trong SQL dump)

| Email | Password | Role |
|---|---|---|
| `admin@ddnc.local` | `Admin@123` | **ADMIN** (gọi được `PUT /orders/:id/status`) |
| `user@ddnc.local` | `User@123` | USER |

Cả hai đã `isVerified=1`, đăng nhập luôn, không cần OTP.

### Dừng / xóa

```bash
docker compose down       # Dừng, giữ data
docker compose down -v    # Dừng + xóa volume MySQL (lần sau up sẽ auto-import lại SQL dump)
```

---

## 4. Import SQL vào MySQL có sẵn (không dùng Docker)

Nếu bạn đã có MySQL sẵn và muốn seed data:

```bash
# Tạo database rỗng
mysql -uroot -p -e "CREATE DATABASE be_btvn CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Import dump (bao gồm schema + data)
mysql -uroot -p be_btvn < BE_BTVN/seed/be_btvn.sql

# Kiểm tra
mysql -uroot -p be_btvn -e "SELECT COUNT(*) FROM products; SELECT email, role FROM users;"
```

Kết quả mong đợi: `products=200`, 2 user demo (`admin@ddnc.local` / `user@ddnc.local`).

---

## 5. Chạy backend **không Docker** (dev mode, hot-reload)

```bash
cd BE_BTVN
cp .env.example .env         # Sửa DB_HOST, EMAIL_* cho phù hợp
npm install
npm run dev                  # ts-node-dev --respawn
```

> Lúc này `src/utils/seeder.ts` sẽ tự đọc `laptops.json` + `laptops2.json` để seed nếu DB rỗng. Nếu đã import dump thì seeder sẽ skip.

---

## 6. Chạy frontend Expo

Expo cần truy cập thiết bị thật/emulator nên **không đóng gói vào Docker**.

```bash
cd BT01
cp .env.example .env         # (nếu có) — sửa EXPO_PUBLIC_API_BASE_URL
npm install
npm start                    # hoặc: npm run android / npm run ios / npm run web
```

### Cấu hình `EXPO_PUBLIC_API_BASE_URL`

| Môi trường chạy | Giá trị |
|---|---|
| Android Emulator | `http://10.0.2.2:5000` (mặc định, không cần đổi) |
| iOS Simulator | `http://localhost:5000` |
| Thiết bị thật | `http://<IP-máy-host>:5000` (IP LAN của máy đang chạy Docker) |

---

## 7. MoMo sandbox

Sandbox key mặc định đã điền trong `docker-compose.yml`:
- `MOMO_PARTNER_CODE=MOMO`
- `MOMO_ACCESS_KEY=F8BBA842ECF85`
- `MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz`

Để nhận **IPN** (server-to-server callback xác nhận thanh toán), backend phải có URL public:

```bash
# Cài ngrok rồi expose
ngrok http 5000

# Copy URL HTTPS → tạo .env cùng thư mục với docker-compose.yml
MOMO_IPN_URL=https://abc123.ngrok-free.app/api/v1/payments/momo/ipn
MOMO_REDIRECT_URL=https://abc123.ngrok-free.app/api/v1/payments/momo/return

# Restart backend để nhận env mới
docker compose up -d backend
```

Nếu chỉ test UI mà không cần thật sự thanh toán, bỏ qua bước ngrok — backend vẫn trả `payUrl` và mở WebView MoMo bình thường, chỉ là thanh toán xong sẽ không tự động cập nhật `paymentStatus=PAID` (vì IPN không đến được).

---

## 8. Smoke test

Chạy test nhanh logic signature MoMo + email template (không cần DB):

```bash
cd BE_BTVN
npm install
npx ts-node-dev --transpile-only src/test-smoke.ts
```

Sẽ tạo `BE_BTVN/tmp/email-confirmed.html` và `email-shipping.html` — mở bằng trình duyệt để xem preview email.

---

## 9. Email thông báo đơn hàng

Template HTML email nằm ở [BE_BTVN/src/utils/order-email.template.ts](BE_BTVN/src/utils/order-email.template.ts). Gửi tự động khi:

| Sự kiện | Trigger | Email |
|---|---|---|
| Admin đổi status → `CONFIRMED` | `PUT /api/v1/orders/:id/status` | 📧 "Đơn hàng đã được xác nhận" |
| Admin đổi status → `SHIPPING` | `PUT /api/v1/orders/:id/status` | 📧 "Đơn hàng đang được giao" |
| MoMo IPN xác nhận thanh toán | Auto khi `paymentStatus=PAID` + `status=PENDING` → `CONFIRMED` | 📧 "Đơn hàng đã được xác nhận" |
| COD auto-confirm sau 30 phút | Bất kỳ request nào vào `GET /orders/*` | 📧 "Đơn hàng đã được xác nhận" |

Các status khác (`COMPLETED`, `CANCELLED`…) hiện **không** gửi email — có thể thêm vào `STATUS_META` ở file template nếu cần.

---

## 10. API endpoints chính

| Method | URL | Auth | Mục đích |
|---|---|---|---|
| POST | `/api/v1/auth/register` | - | Đăng ký + gửi OTP |
| POST | `/api/v1/auth/verify-otp` | - | Xác thực OTP |
| POST | `/api/v1/auth/login` | - | Login → JWT |
| GET | `/api/v1/products` | - | Danh sách sản phẩm |
| GET | `/api/v1/cart` | User | Giỏ hàng |
| POST | `/api/v1/cart/add` | User | Thêm vào giỏ |
| POST | `/api/v1/orders` | User | Checkout (COD hoặc MOMO — trả `payUrl` nếu MOMO) |
| GET | `/api/v1/orders` | User | Đơn của mình |
| GET | `/api/v1/orders/:id` | User | Chi tiết đơn |
| PUT | `/api/v1/orders/:id/cancel` | User | Hủy đơn |
| **PUT** | `/api/v1/orders/:id/status` | **Admin** | Đổi status (kích hoạt email) |
| POST | `/api/v1/payments/momo/init/:orderId` | User | Tạo lại payUrl nếu hết hạn |
| POST | `/api/v1/payments/momo/ipn` | **Public, ký số** | MoMo callback |
| GET | `/api/v1/payments/momo/return` | Public | MoMo redirect HTML |

---

## 11. Troubleshooting

**`docker compose up` báo lỗi `port is already allocated`**
> Đổi port mapping trong `docker-compose.yml` (VD `5001:5000`) hoặc tắt service đang chiếm port.

**Email không về Mailpit**
> Kiểm tra `docker compose logs backend | grep Email` — phải thấy `✅ Email service connected via SMTP mailpit:1025`.

**Admin email `admin@ddnc.local` login không được**
> Chắc chắn SQL dump đã import (container MySQL khởi tạo lần đầu). Nếu volume MySQL đã có sẵn từ lần trước:
> ```
> docker compose down -v
> docker compose up -d
> ```

**MoMo thanh toán xong nhưng order vẫn `UNPAID`**
> IPN URL chưa public. Cần ngrok (mục 7). Trong dev vẫn có thể giả lập PAID bằng cách update DB trực tiếp.

**Expo app không gọi được API**
> Kiểm tra `EXPO_PUBLIC_API_BASE_URL` trong `BT01/.env` khớp với IP máy host (xem mục 6).
