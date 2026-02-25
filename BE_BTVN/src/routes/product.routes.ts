import { Router } from "express";
import { query } from "express-validator";
import {
  getProducts,
  getProductById,
  getCategories,
  getFeaturedProducts,
  getBestSellers,
  getDiscountedProducts,
} from "../controllers/product.controller";

const router = Router();


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


router.get("/", getProductsValidation, getProducts);

router.get("/featured", getFeaturedProducts);

router.get("/best-sellers", getBestSellers);

router.get("/discounted", getDiscountedProducts);

router.get("/:id", getProductById);


router.get("/categories/all", getCategories);

export default router;
