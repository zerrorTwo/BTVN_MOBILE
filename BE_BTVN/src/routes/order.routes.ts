import { Router } from "express";
import { body, param } from "express-validator";
import {
  checkout,
  getOrders,
  getOrderById,
  cancelOrder,
  requestCancelOrder,
  updateOrderStatus,
  validateCouponCode,
  getAvailableCoupons,
} from "../controllers/order.controller";
import { authenticate, requireAdmin } from "../middleware/auth.middleware";
import { PaymentMethod, OrderStatus } from "../models/order.model";

const router = Router();

const checkoutValidators = [
  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .isIn(Object.values(PaymentMethod))
    .withMessage("Invalid payment method"),
  body("shippingAddress")
    .notEmpty()
    .withMessage("Shipping address is required")
    .isLength({ max: 500 })
    .withMessage("Shipping address must not exceed 500 characters"),
  body("receiverName")
    .notEmpty()
    .withMessage("Receiver name is required")
    .isLength({ max: 100 })
    .withMessage("Receiver name must not exceed 100 characters"),
  body("receiverPhone")
    .notEmpty()
    .withMessage("Receiver phone is required")
    .matches(/^(0|\+84)[0-9]{9,10}$/)
    .withMessage("Invalid Vietnamese phone number format"),
  body("note")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Note must not exceed 500 characters"),
  body("couponCode")
    .optional()
    .isString()
    .withMessage("Coupon code must be a string")
    .isLength({ max: 50 })
    .withMessage("Coupon code must not exceed 50 characters"),
];

router.post("/checkout", authenticate, checkoutValidators, checkout);
router.post("/", authenticate, checkoutValidators, checkout);

router.post("/validate-coupon", authenticate, validateCouponCode);

router.get("/coupons", authenticate, getAvailableCoupons);

router.get("/", authenticate, getOrders);

router.get(
  "/:id",
  authenticate,
  [param("id").isInt({ min: 1 }).withMessage("Invalid order ID")],
  getOrderById,
);

router.put(
  "/:id/cancel",
  authenticate,
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid order ID"),
    body("cancellationReason")
      .notEmpty()
      .withMessage("Cancellation reason is required")
      .isLength({ max: 500 })
      .withMessage("Cancellation reason must not exceed 500 characters"),
  ],
  cancelOrder,
);

router.put(
  "/:id/request-cancel",
  authenticate,
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid order ID"),
    body("cancellationReason")
      .notEmpty()
      .withMessage("Cancellation reason is required")
      .isLength({ max: 500 })
      .withMessage("Cancellation reason must not exceed 500 characters"),
  ],
  requestCancelOrder,
);
router.post(
  "/:id/return",
  authenticate,
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid order ID"),
    body("cancellationReason")
      .notEmpty()
      .withMessage("Cancellation reason is required")
      .isLength({ max: 500 })
      .withMessage("Cancellation reason must not exceed 500 characters"),
  ],
  requestCancelOrder,
);

router.put(
  "/:id/status",
  authenticate,
  requireAdmin,
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid order ID"),
    body("status")
      .notEmpty()
      .withMessage("Status is required")
      .isIn(Object.values(OrderStatus))
      .withMessage("Invalid order status"),
  ],
  updateOrderStatus,
);

export default router;
