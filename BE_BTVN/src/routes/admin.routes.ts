import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { requireAdmin } from "../middleware/admin.middleware";
import {
  getAdminDashboard,
  getAdminOrders,
  getAdminOrderDetail,
  updateAdminOrderStatus,
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getAdminBrands,
  createAdminBrand,
  updateAdminBrand,
  deleteAdminBrand,
  getAdminUsers,
  setAdminUserVerified,
  createAdminStaff,
  updateAdminStaff,
  deleteAdminStaff,
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
  getAdminReviews,
  updateAdminReviewVisibility,
  replyAdminReview,
  getAdminReportSummary,
  exportAdminReport,
} from "../controllers/admin.controller";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/dashboard", getAdminDashboard);

router.get("/orders", getAdminOrders);
router.get("/orders/:id", getAdminOrderDetail);
router.put("/orders/:id/status", updateAdminOrderStatus);

router.get("/products", getAdminProducts);
router.post("/products", createAdminProduct);
router.put("/products/:id", updateAdminProduct);
router.delete("/products/:id", deleteAdminProduct);
router.get("/brands", getAdminBrands);
router.post("/brands", createAdminBrand);
router.put("/brands/:id", updateAdminBrand);
router.delete("/brands/:id", deleteAdminBrand);
router.get("/coupons", getAdminCoupons);
router.post("/coupons", createAdminCoupon);
router.put("/coupons/:id", updateAdminCoupon);
router.delete("/coupons/:id", deleteAdminCoupon);
router.get("/reviews", getAdminReviews);
router.put("/reviews/:id/visibility", updateAdminReviewVisibility);
router.put("/reviews/:id/reply", replyAdminReview);
router.get("/reports/summary", getAdminReportSummary);
router.get("/reports/export", exportAdminReport);

router.get("/users", getAdminUsers);
router.put("/users/:id/verified", setAdminUserVerified);
router.post("/staffs", createAdminStaff);
router.put("/staffs/:id", updateAdminStaff);
router.delete("/staffs/:id", deleteAdminStaff);

export default router;
