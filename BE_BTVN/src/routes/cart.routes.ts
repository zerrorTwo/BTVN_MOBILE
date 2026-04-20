import { Router } from "express";
import { body, param } from "express-validator";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cart.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authenticate, getCart);

router.post(
  "/",
  authenticate,
  [
    body("productId")
      .notEmpty()
      .withMessage("Product ID is required")
      .isInt({ min: 1 })
      .withMessage("Product ID must be a positive integer"),
    body("quantity")
      .notEmpty()
      .withMessage("Quantity is required")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
  ],
  addToCart,
);
router.post(
  "/add",
  authenticate,
  [
    body("productId")
      .notEmpty()
      .withMessage("Product ID is required")
      .isInt({ min: 1 })
      .withMessage("Product ID must be a positive integer"),
    body("quantity")
      .notEmpty()
      .withMessage("Quantity is required")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
  ],
  addToCart,
);

router.put(
  "/:itemId",
  authenticate,
  [
    param("itemId").isInt({ min: 1 }).withMessage("Invalid cart item ID"),
    body("quantity")
      .notEmpty()
      .withMessage("Quantity is required")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
  ],
  updateCartItem,
);
router.put(
  "/item/:itemId",
  authenticate,
  [
    param("itemId").isInt({ min: 1 }).withMessage("Invalid cart item ID"),
    body("quantity")
      .notEmpty()
      .withMessage("Quantity is required")
      .isInt({ min: 1 })
      .withMessage("Quantity must be at least 1"),
  ],
  updateCartItem,
);

router.delete(
  "/:itemId",
  authenticate,
  [param("itemId").isInt({ min: 1 }).withMessage("Invalid cart item ID")],
  removeCartItem,
);
router.delete(
  "/item/:itemId",
  authenticate,
  [param("itemId").isInt({ min: 1 }).withMessage("Invalid cart item ID")],
  removeCartItem,
);

router.delete("/", authenticate, clearCart);
router.delete("/clear", authenticate, clearCart);

export default router;
