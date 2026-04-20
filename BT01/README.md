# BT01 - LaptopZone Mobile App

Ứng dụng mobile (Expo + React Native + TypeScript) cho bài toán thương mại điện tử.  
Project tập trung vào các luồng người dùng chính: xác thực OTP, duyệt sản phẩm, giỏ hàng, đặt hàng, quản lý hồ sơ.

## 1) Mục tiêu dự án

- Xây dựng app mobile tích hợp backend `BE_BTVN`.
- Chuẩn hóa gọi API theo version `api/v1`.
- Hoàn thiện các luồng sử dụng tương tự app production:
  - Auth + OTP
  - Home / Search / Wishlist / Cart / Profile
  - Checkout / Orders / Order detail / Tracking
  - Compare sản phẩm

## 2) Công nghệ sử dụng

- Expo + React Native
- TypeScript
- React Navigation (Stack + Bottom Tabs)
- Redux Toolkit + RTK Query
- AsyncStorage
- React Native Paper
- `twrnc` cho utility styles

## 3) Cấu trúc chính

```text
BT01/
├── src/
│   ├── navigation/        # AppNavigator, MainTabs
│   ├── screens/           # Tất cả màn hình app
│   ├── services/api/      # RTK Query API slices
│   ├── store/             # Redux store + auth slice
│   ├── components/        # Reusable UI components
│   ├── theme/             # Màu sắc, typography, bóng đổ
│   ├── types/             # Kiểu dữ liệu dùng chung
│   └── utils/             # Formatter, validation
├── App.tsx
└── package.json
```

## 4) Luồng màn hình

### 4.1 Authentication Flow

1. `Intro`
2. `Login`
3. Nhánh:
   - `Register` -> `OTPVerification (REGISTER)` -> `Home`
   - `ForgetPassword` -> `OTPVerification (RESET_PASSWORD)` -> `ResetPassword` -> `Login`

### 4.2 Main App Flow

Bottom tabs:
- `HomeTab`
- `SearchTab`
- `WishlistTab`
- `CartTab`
- `ProfileTab`

Các màn stack bổ sung:
- `ProductDetail`
- `Compare`
- `Notifications`
- `Checkout`
- `Orders`
- `OrderDetail`
- `OrderTracking`
- `EditProfile`, `ChangePassword`, `ChangePhone`, `ChangeEmail`

## 5) API workflow (BE -> FE)

### 5.1 Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/verify-otp`
- `POST /api/v1/auth/resend-otp`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/forget-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/auth/me`

### 5.2 Product / Cart / Order

- Products:
  - `GET /api/v1/products`
  - `GET /api/v1/products/:id`
  - `GET /api/v1/products/categories/all`
  - `GET /api/v1/products/featured`
  - `GET /api/v1/products/best-sellers`
  - `GET /api/v1/products/discounted`
- Cart:
  - `GET /api/v1/cart`
  - `POST /api/v1/cart/add`
  - `PUT /api/v1/cart/item/:itemId`
  - `DELETE /api/v1/cart/item/:itemId`
  - `DELETE /api/v1/cart/clear`
- Orders:
  - `POST /api/v1/orders`
  - `GET /api/v1/orders`
  - `GET /api/v1/orders/:id`
  - `PUT /api/v1/orders/:id/cancel`

## 6) Workflow các service chính

Các service nằm trong `src/services/api` và được quản lý bởi RTK Query.

### 6.1 `authApi` - Xác thực và vòng đời phiên

- **Đầu vào**: thông tin đăng nhập/đăng ký, OTP, refresh token.
- **Luồng chính**:
  1. `register` -> nhận `email` để điều hướng sang OTP.
  2. `verifyOTP (REGISTER)` -> nhận `token` + `user` -> lưu vào `authSlice`.
  3. `login` -> nhận `token` + `refreshToken` + `user` -> set credentials.
  4. `getCurrentUser` dùng để đồng bộ lại profile khi app mở.
  5. `refresh` dùng để cấp lại access token khi cần.
- **Đầu ra**: trạng thái đăng nhập toàn app (`authSlice`) + token cho các service protected.

### 6.2 `productApi` - Danh sách, tìm kiếm, chi tiết sản phẩm

- **Đầu vào**: params tìm kiếm/lọc/sắp xếp/pagination.
- **Luồng chính**:
  1. `getCategories` tải category filter ở Home/Search.
  2. `getProducts` phục vụ danh sách Search theo query params.
  3. `getBestSellers` và `getDiscountedProducts` cho Home sections.
  4. `getProductById` cho màn Product Detail.
- **Đầu ra**: dữ liệu render cards/list/detail; các màn Home, Search, ProductDetail phụ thuộc trực tiếp service này.

### 6.3 `cartApi` - Quản lý giỏ hàng

- **Đầu vào**: `productId`, `quantity`, `itemId`.
- **Luồng chính**:
  1. `addToCart` từ Product Detail.
  2. `getCart` để render Cart Screen + badge số lượng.
  3. `updateCartItem` tăng/giảm số lượng.
  4. `removeCartItem` hoặc `clearCart`.
  5. Sau checkout thành công, cart được backend dọn item.
- **RTK Query tags**: dùng `invalidatesTags/providesTags` với `Cart` để auto refetch.
- **Đầu ra**: `CartScreen`, `CheckoutScreen`, `MainTabs` badge.

### 6.4 `orderApi` - Đặt hàng, lịch sử, theo dõi

- **Đầu vào**: thông tin checkout + thao tác theo `orderId`.
- **Luồng chính**:
  1. `checkout` từ `CheckoutScreen`.
  2. Điều hướng sang `OrderDetail` bằng `orderId` vừa tạo.
  3. `getOrders` tải danh sách đơn ở `OrdersScreen`.
  4. `getOrderById` cho `OrderDetail` và `OrderTracking`.
  5. `cancelOrder`/`requestCancelOrder` theo điều kiện trạng thái đơn.
- **Đầu ra**: toàn bộ luồng sau mua hàng (post-purchase flow).

### 6.5 `profileApi` - Hồ sơ cá nhân và thông tin bảo mật

- **Đầu vào**: payload cập nhật profile/password/phone/email.
- **Luồng chính**:
  1. `getProfile` -> hiển thị dữ liệu ở Profile Screen.
  2. `updateProfile` -> cập nhật tên/avatar.
  3. `changePassword`.
  4. `requestPhoneOTP` + `changePhone`.
  5. `requestEmailOTP` + `changeEmail`.
- **Đầu ra**: đồng bộ thông tin user giữa backend và state local.

### 6.6 Workflow liên service (E2E)

1. User đăng nhập bằng `authApi`.
2. User duyệt/tìm sản phẩm bằng `productApi`.
3. User thêm giỏ bằng `cartApi`.
4. User checkout bằng `orderApi`.
5. User theo dõi/cancel đơn bằng `orderApi`.
6. User cập nhật hồ sơ bằng `profileApi`.

> Gợi ý production: chuẩn hóa thêm cơ chế auto-refresh token dùng chung cho toàn bộ API slices khi gặp `401`.

## 7) Workflow phát triển

### 7.1 Setup local

```bash
cd BE_BTVN
npm install
npm run dev

cd ../BT01
npm install
npm start
```

### 7.2 Quy trình làm tính năng

1. Thiết kế dữ liệu và endpoint.
2. Implement/điều chỉnh API slice (`src/services/api`).
3. Bind vào screen + state cần thiết.
4. Bổ sung loading/empty/error states.
5. Type-check:
   - `npx tsc --noEmit`
6. Test tay end-to-end trên các flow chính.

### 7.3 Quy ước UI/UX

- Currency format chuẩn `vi-VN`.
- Trạng thái rỗng phải có CTA điều hướng quay lại mua sắm.
- Không dùng polling liên tục cho badge nếu có thể dùng event-driven update.

## 8) Kiểm thử thủ công khuyến nghị

- Đăng ký -> OTP -> đăng nhập.
- Tìm kiếm + lọc + mở chi tiết sản phẩm.
- Thêm yêu thích / thêm so sánh.
- Thêm giỏ hàng -> checkout -> xem order detail/tracking.
- Cập nhật hồ sơ và đổi mật khẩu.

## 9) Lưu ý môi trường

- Android emulator thường dùng base URL: `http://10.0.2.2:5000`.
- Thiết bị thật cần đổi `EXPO_PUBLIC_API_BASE_URL` theo IP máy chạy backend.

---

Nếu cần, có thể tách thêm tài liệu:
- `ARCHITECTURE.md` (kiến trúc chi tiết),
- `TEST_PLAN.md` (test cases),
- `RELEASE_CHECKLIST.md` (checklist trước release).
