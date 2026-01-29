import { Router } from "express";
import { query } from "express-validator";
import {
  getProducts,
  getProductById,
  getCategories,
  getFeaturedProducts,
} from "../controllers/product.controller";

const router = Router();

// ============================================================================
// Validation Rules
// ============================================================================

const getProductsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Trang phải là số nguyên dương"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Giới hạn phải từ 1 đến 50"),
  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Giá tối thiểu phải >= 0"),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Giá tối đa phải >= 0"),
  query("sortBy")
    .optional()
    .isIn(["price", "rating", "sold", "createdAt"])
    .withMessage("Sắp xếp theo: price, rating, sold, createdAt"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Thứ tự: asc hoặc desc"),
];

// ============================================================================
// Public Routes
// ============================================================================

// Get all products with search, filter, pagination
router.get("/", getProductsValidation, getProducts);

// Get featured products (top rated, best sellers, newest)
router.get("/featured", getFeaturedProducts);

// Get product by ID
router.get("/:id", getProductById);

// ============================================================================
// Category Routes
// ============================================================================

// Get all categories
router.get("/categories/all", getCategories);

export default router;
