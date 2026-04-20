# 🖥️ LaptopZone — LLM Project Context

> **Purpose of this file:** Provide complete, unambiguous context to an LLM so it can generate consistent, convention-compliant code without needing clarification on fundamentals. Paste this at the start of every session.

---

## 1. PROJECT OVERVIEW

| Property               | Value                                                   |
| ---------------------- | ------------------------------------------------------- |
| **App Name**           | LaptopZone                                              |
| **Domain**             | Laptop e-commerce (Thương mại điện tử bán laptop)       |
| **Market**             | Vietnam 🇻🇳                                              |
| **UI Language**        | English (labels/code) + Vietnamese (user-facing copy)   |
| **Currency**           | VND — ₫ (Vietnamese Dong)                               |
| **Design Inspiration** | apple.com/vn/mac — minimalist, premium, product-focused |
| **Target Users**       | Tech-savvy individuals buying laptops online, 18–40 y/o |
| **Platforms**          | iOS + Android (React Native) + REST API (Node.js)       |

---

## 2. TECH STACK

### 📱 Frontend — React Native (Expo)

```
Framework      : Expo SDK 51+
Router         : expo-router (file-based, tab + stack)
Language       : TypeScript (strict mode)
Global State   : Zustand (cart, auth, wishlist, compare)
Data Fetching  : TanStack Query v5 (react-query)
Forms          : react-hook-form + zod
HTTP Client    : axios (with JWT interceptor + refresh token logic)
Animation      : react-native-reanimated v3 + moti
Local Storage  : @react-native-async-storage/async-storage
Images         : expo-image (optimized caching)
Icons          : @expo/vector-icons (Ionicons)
Notifications  : expo-notifications
```

### 🖥️ Backend — Node.js + Express

```
Runtime        : Node.js 20+
Framework      : Express.js
Language       : TypeScript
Database       : MongoDB + Mongoose ODM
Cache / Queue  : Redis (via ioredis)
Auth           : JWT — access token (15m) + refresh token (7d, stored in Redis)
File Upload    : Multer + Cloudinary (product images)
Email          : Nodemailer (Gmail SMTP) — order confirmation, reset password
Validation     : express-validator
Realtime       : Socket.io (order status tracking)
Password Hash  : bcryptjs (salt rounds: 12)
Logging        : morgan (dev) + winston (prod)
API Docs       : Swagger / OpenAPI 3.0
```

### 🔴 Redis — Usage Breakdown

```
1. Auth          : Refresh token store (key: refresh:<userId>, TTL: 7d)
                   Blacklist invalidated tokens (key: blacklist:<token>, TTL: 15m)

2. Cache         : Product listings  (key: products:<queryHash>, TTL: 5m)
                   Product detail     (key: product:<id>, TTL: 10m)
                   Featured products  (key: products:featured, TTL: 30m)

3. Rate Limiting : Login attempts     (key: ratelimit:login:<ip>, limit: 5/15m)
                   OTP attempts       (key: ratelimit:otp:<email>)

4. Sessions      : Cart sync for guests (key: cart:guest:<sessionId>, TTL: 24h)

5. Pub/Sub       : Order status events → Socket.io broadcast
```

### 🐳 Infrastructure

```
Containerization : Docker + Docker Compose
Services         : backend (Node.js), mongodb, redis
Dev Tools        : Turborepo (monorepo), pnpm workspaces
```

---

## 3. PROJECT STRUCTURE

```
laptopzone/
├── apps/
│   ├── mobile/                          # React Native Expo app
│   │   ├── app/                         # expo-router file-based pages
│   │   │   ├── (auth)/
│   │   │   │   ├── login.tsx
│   │   │   │   └── register.tsx
│   │   │   ├── (tabs)/
│   │   │   │   ├── index.tsx            # Home
│   │   │   │   ├── search.tsx
│   │   │   │   ├── wishlist.tsx
│   │   │   │   ├── cart.tsx
│   │   │   │   └── profile.tsx
│   │   │   ├── product/
│   │   │   │   ├── [id].tsx             # Product detail
│   │   │   │   └── compare.tsx          # Side-by-side comparison
│   │   │   ├── order/
│   │   │   │   ├── checkout.tsx
│   │   │   │   ├── tracking/[id].tsx
│   │   │   │   └── history.tsx
│   │   │   ├── notifications.tsx
│   │   │   └── _layout.tsx
│   │   ├── components/
│   │   │   ├── ui/                      # Button, Input, Card, Badge, Skeleton...
│   │   │   ├── product/                 # ProductCard, ProductGallery, SpecTable...
│   │   │   ├── cart/                    # CartItem, CartSummary, VoucherInput...
│   │   │   └── order/                   # OrderStatusBadge, TrackingTimeline...
│   │   ├── hooks/                       # useCart, useAuth, useWishlist, useProducts...
│   │   ├── services/                    # api.ts, productService, orderService...
│   │   ├── store/                       # Zustand stores (authStore, cartStore...)
│   │   ├── theme/                       # colors.ts, typography.ts, spacing.ts
│   │   └── types/                       # Shared TS types (re-exported from packages/shared)
│   │
│   └── backend/                         # Node.js Express API
│       ├── src/
│       │   ├── routes/                  # auth, products, orders, users, reviews, vouchers
│       │   ├── controllers/
│       │   ├── models/                  # Mongoose models
│       │   ├── middlewares/             # authenticate, authorize, rateLimit, upload...
│       │   ├── services/                # Business logic (productService, orderService...)
│       │   ├── utils/                   # sendEmail, cloudinary, formatPrice, pagination
│       │   ├── validators/              # express-validator chains
│       │   ├── socket/                  # Socket.io handlers
│       │   ├── redis/                   # Redis client + helper functions
│       │   └── app.ts
│       ├── seed/                        # Seed scripts (laptops, users, vouchers)
│       ├── Dockerfile
│       └── .env.example
│
├── packages/
│   └── shared/                          # Types & constants shared across apps
│       ├── types/                       # Product, Order, User, Review interfaces
│       └── constants/                   # OrderStatus, PaymentMethod enums
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 4. DATA MODELS

### 🖥️ Laptop (Product)

```typescript
interface Laptop {
  _id: string;
  name: string; // e.g. "Dell XPS 15 9530"
  slug: string; // e.g. "dell-xps-15-9530"
  brand: LaptopBrand;
  category: LaptopCategory;
  price: number; // VND e.g. 35000000
  originalPrice: number; // Price before discount
  discount: number; // Percentage e.g. 10 (= 10%)
  stock: number;
  sold: number;
  rating: number; // Computed avg from reviews, 1–5
  reviewCount: number;
  images: string[]; // Cloudinary URLs
  thumbnail: string;
  colors: string[]; // e.g. ['Silver', 'Space Black']

  specs: {
    cpu: string; // e.g. "Intel Core i7-13700H"
    cpuBrand: "Intel" | "AMD" | "Apple";
    cpuGeneration: string;
    ram: number; // GB: 8 | 16 | 32 | 64
    ramType: "DDR4" | "DDR5" | "LPDDR5" | "LPDDR4X";
    storage: number; // GB: 256 | 512 | 1000 | 2000
    storageType: "NVMe SSD" | "SATA SSD";
    gpu: string; // e.g. "NVIDIA RTX 4060 8GB"
    gpuType: "Dedicated" | "Integrated";
    display: string; // e.g. "15.6\" FHD IPS 144Hz"
    displaySize: number; // 13 | 14 | 15.6 | 16 | 17
    resolution: string; // "1920x1080" | "2560x1600" | "3840x2400"
    refreshRate: number; // Hz: 60 | 90 | 120 | 144 | 165 | 240
    panelType: "IPS" | "OLED" | "VA" | "TN" | "Mini-LED";
    battery: number; // Wh
    batteryLife: string; // e.g. "Up to 12 hours"
    weight: number; // kg e.g. 1.8
    os: "Windows 11 Home" | "Windows 11 Pro" | "macOS" | "No OS";
    ports: string[]; // e.g. ["USB-A x2", "USB-C", "HDMI 2.1", "SD Card"]
    wireless: string; // e.g. "WiFi 6E, Bluetooth 5.3"
    webcam: string; // e.g. "1080p FHD"
  };

  features: string[]; // e.g. ["RGB Keyboard", "Touchscreen", "Fingerprint"]
  shortDescription: string; // 1–2 sentences for cards
  description: string; // Full HTML/Markdown description
  warranty: string; // e.g. "24 months official warranty"
  isActive: boolean;
  isFeatured: boolean;
  tags: string[]; // e.g. ["gaming", "thin-light", "budget"]
  createdAt: Date;
  updatedAt: Date;
}

type LaptopBrand =
  | "Apple"
  | "Dell"
  | "HP"
  | "Asus"
  | "Lenovo"
  | "Acer"
  | "MSI"
  | "LG"
  | "Samsung"
  | "Razer";
type LaptopCategory =
  | "Gaming"
  | "Office"
  | "Creator"
  | "Ultrabook"
  | "Student"
  | "Workstation";
```

### 👤 User

```typescript
interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  password: string; // bcrypt hashed
  avatar: string;
  role: "customer" | "admin";
  addresses: Address[];
  wishlist: string[]; // Product IDs
  compareList: string[]; // Max 3 Product IDs
  viewHistory: string[]; // Last 20 viewed Product IDs
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
}

interface Address {
  _id: string;
  label: string; // e.g. "Home", "Office" / "Nhà", "Công ty"
  fullName: string;
  phone: string;
  province: string; // Tỉnh/Thành phố
  district: string; // Quận/Huyện
  ward: string; // Phường/Xã
  street: string;
  isDefault: boolean;
}
```

### 📦 Order

```typescript
interface Order {
  _id: string;
  orderCode: string; // e.g. "LZ-20240120-0001"
  user: string;
  items: OrderItem[];
  shippingAddress: Address;

  subtotal: number; // Sum of items
  shippingFee: number;
  voucherDiscount: number;
  total: number; // subtotal + shippingFee - voucherDiscount

  voucher?: string; // Voucher ID (if applied)
  paymentMethod: PaymentMethod;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";

  status: OrderStatus;
  statusHistory: StatusEvent[];

  note: string; // Customer note
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

type PaymentMethod = "COD" | "bank_transfer" | "momo" | "vnpay";

type OrderStatus =
  | "pending" // Chờ xác nhận
  | "confirmed" // Đã xác nhận
  | "preparing" // Đang chuẩn bị hàng
  | "shipping" // Đang giao hàng
  | "delivered" // Đã giao hàng
  | "cancelled" // Đã huỷ
  | "return_requested" // Yêu cầu hoàn hàng
  | "returned"; // Đã hoàn hàng

interface OrderItem {
  product: string;
  name: string; // Snapshot at purchase time
  thumbnail: string;
  price: number; // Snapshot price
  quantity: number;
  color: string;
}

interface StatusEvent {
  status: OrderStatus;
  note: string;
  updatedBy: string; // User ID (admin or system)
  timestamp: Date;
}
```

### ⭐ Review

```typescript
interface Review {
  _id: string;
  product: string;
  user: string;
  order: string; // Must have a delivered order
  rating: number; // 1–5
  title: string;
  content: string;
  images: string[];
  pros: string[]; // e.g. ["Long battery", "Sharp display"]
  cons: string[]; // e.g. ["Heavy", "No SD slot"]
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  helpfulUsers: string[]; // User IDs who marked helpful
  createdAt: Date;
}
```

### 🎟️ Voucher

```typescript
interface Voucher {
  _id: string;
  code: string; // e.g. "SAVE100K", "SUMMER10"
  type: "percent" | "fixed";
  value: number; // 10 for 10% | 100000 for ₫100,000 off
  minOrderValue: number; // Minimum cart value to apply
  maxDiscount: number; // Cap for percent-type (e.g. max ₫500,000 off)
  usageLimit: number; // Total uses allowed
  usedCount: number;
  userLimit: number; // Uses per user (usually 1)
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}
```

---

## 5. API ENDPOINTS

### Base URL

- **Development:** `http://localhost:5000/api/v1`
- **Docker:** `http://backend:5000/api/v1`

### Auth `/auth`

```
POST   /auth/register              # Create account
POST   /auth/login                 # Returns access + refresh token
POST   /auth/logout                # Blacklist token in Redis
POST   /auth/refresh               # Use refresh token → new access token
POST   /auth/forgot-password       # Send reset email
POST   /auth/reset-password        # Confirm reset with token
GET    /auth/me                    # Get current user profile
PUT    /auth/change-password
```

### Products `/products`

```
GET    /products                   # List — supports: ?brand=&category=&ram=&cpu=&gpu=&minPrice=&maxPrice=&sort=&page=&limit=
GET    /products/featured          # Featured + deals (cached in Redis)
GET    /products/search?q=         # Full-text search
GET    /products/compare?ids=      # Up to 3 product IDs comma-separated
GET    /products/:id
GET    /products/slug/:slug
POST   /products                   # [Admin] Create
PUT    /products/:id               # [Admin] Update (clears Redis cache)
DELETE /products/:id               # [Admin] Soft delete
POST   /products/:id/images        # [Admin] Upload images to Cloudinary
```

### Cart `/cart`

```
GET    /cart                       # Get current user's cart
POST   /cart/add                   # { productId, quantity, color }
PUT    /cart/item/:itemId          # Update quantity
DELETE /cart/item/:itemId          # Remove item
DELETE /cart/clear
POST   /cart/apply-voucher         # { code } → validates & returns discount
DELETE /cart/remove-voucher
```

### Orders `/orders`

```
GET    /orders                     # Customer: own orders | Admin: all orders
GET    /orders/:id
POST   /orders                     # Place order (from cart)
PUT    /orders/:id/cancel          # Customer: only when status = pending|confirmed
PUT    /orders/:id/status          # [Admin] Update status → publishes to Redis Pub/Sub
POST   /orders/:id/return          # Customer: request return
```

### Reviews `/products/:id/reviews`

```
GET    /products/:id/reviews       # ?rating=&sort=&page=
POST   /products/:id/reviews       # Must have delivered order for this product
PUT    /reviews/:id                # Own review only
DELETE /reviews/:id                # Own review or admin
POST   /reviews/:id/helpful        # Toggle helpful flag
```

### Users `/users` (Admin only)

```
GET    /users
GET    /users/:id
PUT    /users/:id
DELETE /users/:id
PUT    /users/:id/toggle-active
```

### Wishlist `/wishlist`

```
GET    /wishlist
POST   /wishlist/:productId        # Toggle (add if not exists, remove if exists)
DELETE /wishlist/:productId
```

### Vouchers `/vouchers`

```
GET    /vouchers                   # [Admin] All vouchers
POST   /vouchers/validate          # { code, cartTotal } → returns discount info
POST   /vouchers                   # [Admin] Create
PUT    /vouchers/:id               # [Admin] Update
DELETE /vouchers/:id               # [Admin] Delete
```

### Uploads `/upload`

```
POST   /upload/image               # Single → returns Cloudinary URL
POST   /upload/images              # Multiple (max 5)
```

---

## 6. REDIS KEY CONVENTIONS

```
# Auth
refresh:<userId>              TTL: 7d     Stores refresh token string
blacklist:<jti>               TTL: 15m    Invalidated access token JTI

# Cache
product:<id>                  TTL: 10m    Single product JSON
products:<queryHash>          TTL: 5m     Paginated product list JSON
products:featured             TTL: 30m    Featured products JSON

# Rate Limiting
ratelimit:login:<ip>          TTL: 15m    Login attempt counter
ratelimit:otp:<email>         TTL: 10m    OTP attempt counter

# Guest Cart
cart:guest:<sessionId>        TTL: 24h    Cart JSON for unauthenticated users

# Pub/Sub channels
order:status                             Publishes { orderId, status, userId }
```

---

## 7. SCREENS & NAVIGATION

### Bottom Tab Structure

| Tab | Screen   | Icon                    |
| --- | -------- | ----------------------- |
| 1   | Home     | `home`                  |
| 2   | Search   | `search`                |
| 3   | Wishlist | `heart`                 |
| 4   | Cart     | `cart` + quantity badge |
| 5   | Profile  | `person`                |

### Stack Screens

```
product/[id]                 Product detail
product/compare              Side-by-side comparison (max 3)
order/checkout               Checkout flow
order/tracking/[id]          Real-time order tracking (Socket.io)
order/history                Order history list
(auth)/login
(auth)/register
profile/edit
profile/addresses
notifications
```

---

## 8. DESIGN SYSTEM

### Colors

```typescript
export const colors = {
  // Brand
  primary: "#0071E3", // Apple blue — CTAs, links
  primaryDark: "#0051A2",
  primaryLight: "#E8F2FF",

  // Neutrals
  black: "#0A0A0A",
  white: "#FFFFFF",
  background: "#F5F5F7", // Apple light grey page bg
  surface: "#FFFFFF", // Card background
  surfaceAlt: "#F5F5F7",

  // Text
  textPrimary: "#1D1D1F", // Apple dark text
  textSecondary: "#6E6E73", // Muted/subheading
  textTertiary: "#AEAEB2", // Placeholder, disabled

  // Semantic
  success: "#34C759",
  warning: "#FF9F0A",
  error: "#FF3B30",

  // Border
  border: "#D2D2D7",
  borderLight: "#E8E8ED",

  // Price
  salePrice: "#FF3B30", // Discounted price
  originalPrice: "#6E6E73", // Strikethrough original price
};
```

### Typography

```typescript
export const typography = {
  displayLarge: { fontSize: 34, fontWeight: "700", letterSpacing: -0.5 },
  displayMedium: { fontSize: 28, fontWeight: "700", letterSpacing: -0.3 },
  h1: { fontSize: 24, fontWeight: "700" },
  h2: { fontSize: 20, fontWeight: "600" },
  h3: { fontSize: 17, fontWeight: "600" },
  bodyLarge: { fontSize: 17, fontWeight: "400", lineHeight: 24 },
  body: { fontSize: 15, fontWeight: "400", lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: "400", lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: "400" },
  label: { fontSize: 11, fontWeight: "500", letterSpacing: 0.5 },
};
```

### Spacing

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
  "4xl": 64,
};
```

---

## 9. BUSINESS RULES

```
PRICING
  - All prices in VND integer (no decimals)
  - Display format: Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
    e.g. 35.990.000 ₫
  - Show original price (strikethrough) + sale price (red) + "Giảm X%" badge

CART
  - Max 10 distinct products
  - Max quantity per item: 5
  - Guest cart: stored in Redis (sessionId) — merged on login
  - Logged-in cart: persisted to DB, synced on app start

ORDERS
  - Customer can cancel only when status = 'pending' | 'confirmed'
  - Customer can review only after status = 'delivered'
  - One review per order item
  - Admin status updates fire Redis Pub/Sub → Socket.io → app notification

VOUCHER
  - Only one voucher per order (no stacking)
  - Validate: expiry, minOrderValue, remaining usageLimit, userLimit
  - maxDiscount cap applies to 'percent' type only

COMPARE
  - Max 3 laptops at once
  - Recommended same category (warn but don't block)

SEARCH
  - Search fields: name, brand, cpu, gpu, features, tags
  - Save last 5 searches to AsyncStorage
  - Debounce: 400ms
  - Results cached in Redis by query string hash (TTL: 5m)

REVIEWS
  - Only verified purchasers (has delivered order) can review
  - Editing allowed within 30 days
  - Product rating = avg of all review ratings (recalculated on save)
```

---

## 10. SEED DATA

### Brands

`Apple | Dell | HP | Asus | Lenovo | Acer | MSI | LG | Samsung | Razer`

### 20 Sample Laptops

| Name                      | Brand   | Price (₫)  | Category  |
| ------------------------- | ------- | ---------- | --------- |
| MacBook Air M3 13"        | Apple   | 28,990,000 | Ultrabook |
| MacBook Pro M3 Pro 14"    | Apple   | 52,990,000 | Creator   |
| Dell XPS 15 9530          | Dell    | 42,990,000 | Creator   |
| Dell Inspiron 15 3530     | Dell    | 18,990,000 | Student   |
| HP Spectre x360 14        | HP      | 38,990,000 | Ultrabook |
| HP Victus 15              | HP      | 22,990,000 | Gaming    |
| Asus ROG Strix G16        | Asus    | 45,990,000 | Gaming    |
| Asus ZenBook 14 OLED      | Asus    | 29,990,000 | Office    |
| Lenovo ThinkPad X1 Carbon | Lenovo  | 48,990,000 | Office    |
| Lenovo IdeaPad Gaming 3   | Lenovo  | 24,990,000 | Gaming    |
| Acer Swift 5              | Acer    | 21,990,000 | Ultrabook |
| Acer Predator Helios 16   | Acer    | 39,990,000 | Gaming    |
| MSI Titan GT77            | MSI     | 89,990,000 | Gaming    |
| MSI Creator Z16           | MSI     | 62,990,000 | Creator   |
| LG Gram 16                | LG      | 35,990,000 | Ultrabook |
| Samsung Galaxy Book4 Pro  | Samsung | 41,990,000 | Office    |
| Asus TUF Gaming A15       | Asus    | 27,990,000 | Gaming    |
| HP EliteBook 840 G10      | HP      | 32,990,000 | Office    |
| Razer Blade 15            | Razer   | 75,990,000 | Gaming    |
| Dell Latitude 5540        | Dell    | 30,990,000 | Office    |

### Sample Users

```
admin@laptopzone.vn  /  Admin@123   (role: admin)
john@example.com     /  User@123    (role: customer)
jane@example.com     /  User@123    (role: customer)
```

### Sample Vouchers

| Code      | Type    | Value   | Min Order  | Expires |
| --------- | ------- | ------- | ---------- | ------- |
| WELCOME10 | percent | 10%     | 5,000,000  | 30 days |
| SAVE500K  | fixed   | 500,000 | 20,000,000 | 14 days |
| SUMMER15  | percent | 15%     | 15,000,000 | 7 days  |
| NEWUSER   | fixed   | 200,000 | 3,000,000  | 30 days |
| GAMING20  | percent | 20%     | 30,000,000 | 14 days |

---

## 11. API RESPONSE FORMAT

### Success

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Invalid email address" }]
}
```

---

## 12. ERROR HANDLING STANDARDS

### Backend

```
- All async route handlers wrapped in asyncHandler (no try/catch boilerplate)
- Global error middleware catches all errors
- HTTP status codes used correctly (400, 401, 403, 404, 422, 429, 500)
- Never expose stack traces in production
- Log full error server-side, return sanitized message to client
```

### Frontend — Every screen MUST handle these states

```
⬜ loading    — Skeleton loader (NOT full-screen spinner)
⬜ error      — Error message + "Try Again" button
⬜ empty      — Illustration + descriptive empty state copy
⬜ success    — Toast notification (bottom, 2s)
⬜ offline    — "No internet connection" banner (top)
```

---

## 13. CODING CONVENTIONS

```typescript
// Components → PascalCase
const ProductCard = () => { ... }

// Hooks → camelCase, prefix with "use"
const useCart = () => { ... }

// Services → camelCase, suffix "Service"
const productService = { ... }

// Constants → SCREAMING_SNAKE_CASE
const MAX_COMPARE_ITEMS = 3;

// Types/Interfaces → PascalCase
interface CartItem { ... }
type OrderStatus = 'pending' | 'delivered';

// Files → kebab-case
// product-card.tsx → exports ProductCard
// product.service.ts → exports productService

// Rules:
// ✅ ALL API calls go through service layer — never axios directly in component
// ✅ All async functions use try/catch — no unhandled promises
// ✅ No hardcoded strings in UI — use constants or i18n keys
// ✅ TypeScript strict mode — no `any` without comment justification
// ✅ Redis cache invalidated on every write mutation
```

---

## 14. MAIN USER FLOW (Happy Path)

```
Browse Home
  → View product listing (filter/sort)
    → View product detail (specs, gallery, reviews)
      → Add to Cart [requires login → redirect to login]
        → Apply voucher
          → Checkout (select address → select payment → confirm)
            → Receive email confirmation
              → Track order status (real-time via Socket.io)
                → Item delivered → Write review
```

---

## 15. FEATURE IMPLEMENTATION CHECKLIST

Before marking any feature as **done**, verify:

```
□ API endpoint complete (all needed HTTP methods)
□ Input validation on server (express-validator)
□ Auth middleware applied where required
□ Redis cache set on reads, invalidated on writes
□ Correct HTTP status codes returned
□ Response format matches API Response Format spec (section 11)
□ Frontend has all 5 states: loading / error / empty / success / offline
□ No TypeScript errors in strict mode
□ No unhandled console.error in React Native
□ Tested on iOS Simulator AND Android Emulator
□ Seed data covers this feature's use cases
```

---

_Version: 1.1.0 | Language: English + Vietnamese (UI copy)_
_Update this file whenever architecture, models, or business rules change significantly._
