import { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";
import { Product, Category } from "../models/product.model";
import {
  ProductListResponse,
  ProductDetailResponse,
  CategoryListResponse,
  ProductListItem,
  ProductDetail,
  ProductQueryParams,
} from "../types";

/**
 * Format product for list response
 */
const formatProductListItem = (product: Product): ProductListItem => ({
  id: product.id,
  name: product.name,
  price: Number(product.price),
  originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
  image: product.image,
  rating: Number(product.rating),
  ratingCount: product.ratingCount,
  sold: product.sold,
  categoryId: product.categoryId,
  categoryName: product.category?.name,
});

/**
 * Format product for detail response
 */
const formatProductDetail = (product: Product): ProductDetail => ({
  ...formatProductListItem(product),
  description: product.description,
  images: product.images ? JSON.parse(product.images) : [],
  stock: product.stock,
  isActive: product.isActive,
  createdAt: product.createdAt.toISOString(),
  updatedAt: product.updatedAt.toISOString(),
});

// ============================================================================
// Product Controllers
// ============================================================================

/**
 * @route   GET /api/products
 * @desc    Get all products with search, filter, and pagination
 * @access  Public
 */
export const getProducts = async (
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "desc",
    }: ProductQueryParams = req.query;

    // Build where clause
    const where: any = { isActive: true };

    // Search by name or description
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    // Filter by category
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Filter by price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price[Op.gte] = minPrice;
      }
      if (maxPrice !== undefined) {
        where.price[Op.lte] = maxPrice;
      }
    }

    // Validate sortBy
    const allowedSortFields = ["price", "rating", "sold", "createdAt"];
    const sortField = allowedSortFields.includes(sortBy as string)
      ? sortBy
      : "createdAt";

    // Calculate pagination
    const offset = (Number(page) - 1) * Number(limit);

    // Query products
    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],
        },
      ],
      order: [[sortField as string, sortOrder === "asc" ? "ASC" : "DESC"]],
      limit: Number(limit),
      offset,
    });

    const response: ProductListResponse = {
      success: true,
      message: "Lấy danh sách sản phẩm thành công",
      data: {
        products: products.map(formatProductListItem),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          totalPages: Math.ceil(count / Number(limit)),
        },
      },
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách sản phẩm",
    });
  }
};

/**
 * @route   GET /api/products/:id
 * @desc    Get product detail by ID
 * @access  Public
 */
export const getProductById = async (
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      where: { id, isActive: true },
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      } as ProductDetailResponse);
      return;
    }

    const response: ProductDetailResponse = {
      success: true,
      message: "Lấy chi tiết sản phẩm thành công",
      product: formatProductDetail(product),
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error("Get product by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết sản phẩm",
    });
  }
};

/**
 * @route   GET /api/categories
 * @desc    Get all categories
 * @access  Public
 */
export const getCategories = async (
  _req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      attributes: ["id", "name", "description", "image"],
      order: [["name", "ASC"]],
    });

    // Get product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.count({
          where: { categoryId: category.id, isActive: true },
        });
        return {
          id: category.id,
          name: category.name,
          description: category.description,
          image: category.image,
          productCount,
        };
      }),
    );

    const response: CategoryListResponse = {
      success: true,
      message: "Lấy danh sách danh mục thành công",
      categories: categoriesWithCount,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách danh mục",
    });
  }
};

/**
 * @route   GET /api/products/featured
 * @desc    Get featured products (top rated, best sellers)
 * @access  Public
 */
export const getFeaturedProducts = async (
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  try {
    const limit = Number(req.query.limit) || 10;

    // Get top rated products
    const topRated = await Product.findAll({
      where: { isActive: true },
      include: [
        { model: Category, as: "category", attributes: ["id", "name"] },
      ],
      order: [["rating", "DESC"]],
      limit,
    });

    // Get best sellers
    const bestSellers = await Product.findAll({
      where: { isActive: true },
      include: [
        { model: Category, as: "category", attributes: ["id", "name"] },
      ],
      order: [["sold", "DESC"]],
      limit,
    });

    // Get newest products
    const newest = await Product.findAll({
      where: { isActive: true },
      include: [
        { model: Category, as: "category", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
      limit,
    });

    res.status(200).json({
      success: true,
      message: "Lấy sản phẩm nổi bật thành công",
      data: {
        topRated: topRated.map(formatProductListItem),
        bestSellers: bestSellers.map(formatProductListItem),
        newest: newest.map(formatProductListItem),
      },
    });
  } catch (error: any) {
    console.error("Get featured products error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy sản phẩm nổi bật",
    });
  }
};
