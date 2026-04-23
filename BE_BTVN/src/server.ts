import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database";
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import productRoutes from "./routes/product.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import adminRoutes from "./routes/admin.routes";
import paymentRoutes from "./routes/payment.routes";
import {
  User,
  Product,
  Category,
  Brand,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Coupon,
  Review,
  Payment,
} from "./models";
import seedProducts from "./utils/seeder";
import { errorHandler } from "./middleware/error.middleware";
import emailService from "./services/email.service";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Welcome to BE_BTVN API - OTP Authentication System",
    version: "2.0.0",
    baseUrl: "/api/v1",
    endpoints: {
      register: "POST /api/v1/auth/register",
      verifyOTP: "POST /api/v1/auth/verify-otp",
      resendOTP: "POST /api/v1/auth/resend-otp",
      login: "POST /api/v1/auth/login",
      refresh: "POST /api/v1/auth/refresh",
      logout: "POST /api/v1/auth/logout",
      forgetPassword: "POST /api/v1/auth/forget-password",
      resetPassword: "POST /api/v1/auth/reset-password",
      getCurrentUser: "GET /api/v1/auth/me (protected)",
      products: "GET /api/v1/products",
      productDetail: "GET /api/v1/products/:id",
      categories: "GET /api/v1/products/categories/all",
      featured: "GET /api/v1/products/featured",
      cart: "GET /api/v1/cart (protected)",
      addToCart: "POST /api/v1/cart/add (protected)",
      updateCartItem: "PUT /api/v1/cart/item/:itemId (protected)",
      removeCartItem: "DELETE /api/v1/cart/item/:itemId (protected)",
      checkout: "POST /api/v1/orders (protected)",
      orders: "GET /api/v1/orders (protected)",
      orderDetail: "GET /api/v1/orders/:id (protected)",
      cancelOrder: "PUT /api/v1/orders/:id/cancel (protected)",
    },
    features: [
      "✅ OTP Email Verification",
      "✅ JWT Authentication",
      "✅ Password Hashing (bcrypt)",
      "✅ Secure Password Reset",
      "✅ Shopping Cart Management",
      "✅ Order & Checkout System",
      "✅ Order Tracking & Cancellation",
    ],
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/payments", paymentRoutes);

// Backward compatible routes for existing clients
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDatabase();

    // alter: true → adds missing columns to existing tables (safe for dev, no data loss)
    await User.sync({ alter: true });
    await Category.sync({ alter: true });
    await Brand.sync({ alter: true });
    await Product.sync({ alter: true });
    await Cart.sync({ alter: true });
    await CartItem.sync({ alter: true });
    await Order.sync({ alter: true });
    await OrderItem.sync({ alter: true });
    await Coupon.sync({ alter: true });
    await Review.sync({ alter: true });
    await Payment.sync({ alter: true });

    await seedProducts();

    await emailService.verifyConnection();

    const os = require("os");
    const networkInterfaces = os.networkInterfaces();
    let localIP = "localhost";

    for (const interfaceName in networkInterfaces) {
      const addresses = networkInterfaces[interfaceName];
      if (addresses) {
        for (const addr of addresses) {
          if (addr.family === "IPv4" && !addr.internal) {
            localIP = addr.address;
            break;
          }
        }
      }
      if (localIP !== "localhost") break;
    }

    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Local: http://localhost:${PORT}`);
      console.log(`Network: http://${localIP}:${PORT}`);
      console.log(`Android Emulator: http://10.0.2.2:${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
