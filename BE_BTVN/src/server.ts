import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database";
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import productRoutes from "./routes/product.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import { Product, Category, Cart, CartItem, Order, OrderItem } from "./models";
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
    endpoints: {
      register: "POST /api/auth/register",
      verifyOTP: "POST /api/auth/verify-otp",
      resendOTP: "POST /api/auth/resend-otp",
      login: "POST /api/auth/login",
      forgetPassword: "POST /api/auth/forget-password",
      resetPassword: "POST /api/auth/reset-password",
      getCurrentUser: "GET /api/auth/me (protected)",
      products: "GET /api/products",
      productDetail: "GET /api/products/:id",
      categories: "GET /api/products/categories/all",
      featured: "GET /api/products/featured",
      cart: "GET /api/cart (protected)",
      addToCart: "POST /api/cart (protected)",
      updateCartItem: "PUT /api/cart/:itemId (protected)",
      removeCartItem: "DELETE /api/cart/:itemId (protected)",
      checkout: "POST /api/orders/checkout (protected)",
      orders: "GET /api/orders (protected)",
      orderDetail: "GET /api/orders/:id (protected)",
      cancelOrder: "PUT /api/orders/:id/cancel (protected)",
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

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDatabase();

    await Category.sync();
    await Product.sync();
    await Cart.sync();
    await CartItem.sync();
    await Order.sync();
    await OrderItem.sync();

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
