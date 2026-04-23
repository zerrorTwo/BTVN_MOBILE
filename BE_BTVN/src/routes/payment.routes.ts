import { Router } from "express";
import { param } from "express-validator";
import {
  initMomoPayment,
  momoIpn,
  momoReturn,
} from "../controllers/payment.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Retry / regenerate a MoMo payment URL for an order the user owns.
router.post(
  "/momo/init/:orderId",
  authenticate,
  [param("orderId").isInt({ min: 1 }).withMessage("Invalid order ID")],
  initMomoPayment,
);

// MoMo server-to-server IPN — public, verified by signature.
router.post("/momo/ipn", momoIpn);

// Browser redirect after MoMo payment — public HTML page.
router.get("/momo/return", momoReturn);

export default router;
