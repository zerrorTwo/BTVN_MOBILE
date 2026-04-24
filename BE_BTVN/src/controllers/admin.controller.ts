import { Request, Response } from "express";
import { Op } from "sequelize";
import bcrypt from "bcryptjs";
import { User, Product, Category, Order, OrderItem, Coupon, Review } from "../models";
import { CouponType } from "../models/coupon.model";
import { OrderStatus } from "../models/order.model";
import { setOrderStatus, OrderError } from "../services/order.service";

const ORDER_STATUS_GROUPS: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.SHIPPING,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
  OrderStatus.CANCEL_REQUESTED,
];

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getPaginationQuery = (req: Request): { page: number; limit: number; offset: number } => {
  const pageRaw = Number(req.query.page ?? 1);
  const limitRaw = Number(req.query.limit ?? 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 100) : 10;
  return { page, limit, offset: (page - 1) * limit };
};

const getRangeStart = (period: "day" | "month" | "year"): Date => {
  const now = new Date();
  if (period === "day") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(now.getFullYear(), 0, 1);
};

const getPeriodRange = (
  period: "day" | "month" | "year",
  from?: string,
  to?: string,
): { start: Date; end: Date } => {
  if (from && to) {
    return { start: new Date(from), end: new Date(to) };
  }

  const now = new Date();
  if (period === "day") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }
  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start, end };
  }
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear() + 1, 0, 1);
  return { start, end };
};

const mapOrderSummary = (order: Order & { user?: User; items?: OrderItem[] }) => ({
  id: order.id,
  orderCode: order.orderCode,
  status: order.status,
  total: toNumber(order.total),
  paymentMethod: order.paymentMethod,
  receiverName: order.receiverName,
  receiverPhone: order.receiverPhone,
  shippingAddress: order.shippingAddress,
  cancellationReason: order.cancellationReason,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  customer: order.user
    ? {
        id: order.user.id,
        name: order.user.name,
        email: order.user.email,
      }
    : null,
  itemsCount: order.items?.length ?? 0,
});

export const getAdminDashboard = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const [todayRevenue, monthRevenue, yearRevenue, totalUsers, grouped] =
      await Promise.all([
        Order.sum("total", {
          where: {
            status: { [Op.notIn]: [OrderStatus.CANCELLED] },
            createdAt: { [Op.gte]: getRangeStart("day") },
          } as any,
        }),
        Order.sum("total", {
          where: {
            status: { [Op.notIn]: [OrderStatus.CANCELLED] },
            createdAt: { [Op.gte]: getRangeStart("month") },
          } as any,
        }),
        Order.sum("total", {
          where: {
            status: { [Op.notIn]: [OrderStatus.CANCELLED] },
            createdAt: { [Op.gte]: getRangeStart("year") },
          } as any,
        }),
        User.count({ where: { role: "USER" } }),
        Order.findAll({
          attributes: [
            "status",
            [Order.sequelize!.fn("COUNT", Order.sequelize!.col("id")), "count"],
          ],
          group: ["status"],
          raw: true,
        }),
      ]);

    const groupedMap = new Map<string, number>();
    for (const row of grouped as unknown as Array<{
      status: string;
      count: string;
    }>) {
      groupedMap.set(row.status, Number(row.count));
    }

    res.json({
      success: true,
      message: "Admin dashboard loaded successfully",
      data: {
        revenue: {
          day: {
            label: "Revenue (Day)",
            value: toNumber(todayRevenue),
            delta: 0,
          },
          month: {
            label: "Revenue (Month)",
            value: toNumber(monthRevenue),
            delta: 0,
          },
          year: {
            label: "Revenue (Year)",
            value: toNumber(yearRevenue),
            delta: 0,
          },
        },
        totalUsers,
        ordersByStatus: ORDER_STATUS_GROUPS.map((status) => ({
          status,
          count: groupedMap.get(status) ?? 0,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const getAdminOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const search = String(req.query.search ?? "").trim();
    const status = String(req.query.status ?? "").trim();
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      where.status = status;
    }
    if (search) {
      where.orderCode = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
        {
          model: OrderItem,
          as: "items",
          attributes: ["id"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: rows.map((order) =>
        mapOrderSummary(order as Order & { user?: User; items?: OrderItem[] }),
      ),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load admin orders",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const getAdminOrderDetail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const orderId = Number(req.params.id);
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "phone"],
        },
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "image", "price"],
            },
          ],
        },
      ],
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get admin order detail",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const updateAdminOrderStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const orderId = Number(req.params.id);
    const { status, reason } = req.body as {
      status: OrderStatus;
      reason?: string;
    };

    if (!Object.values(OrderStatus).includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
      return;
    }

    try {
      const order = await setOrderStatus(orderId, status, {
        cancellationReason: reason,
      });
      res.json({
        success: true,
        message: "Order status updated",
        data: { id: order.id, status: order.status },
      });
    } catch (err) {
      if (err instanceof OrderError) {
        res.status(err.statusCode).json({ success: false, message: err.message });
        return;
      }
      throw err;
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const getAdminProducts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationQuery(req);
    const search = String(req.query.search ?? "").trim();
    const where = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } },
          ],
        }
      : undefined;

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load admin products",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const createAdminProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const payload = req.body as {
      name: string;
      price: number;
      categoryId?: number;
      description?: string;
      image?: string;
      stock?: number;
      originalPrice?: number;
    };
    const product = await Product.create({
      name: payload.name,
      price: payload.price,
      categoryId: payload.categoryId ?? null,
      description: payload.description ?? null,
      image: payload.image ?? null,
      stock: payload.stock ?? 0,
      originalPrice: payload.originalPrice ?? null,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Product created",
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const updateAdminProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    await product.update(req.body);
    res.json({
      success: true,
      message: "Product updated",
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const deleteAdminProduct = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const product = await Product.findByPk(id);
    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    await product.destroy();
    res.json({
      success: true,
      message: "Product deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const getAdminBrands = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationQuery(req);
    const search = String(req.query.search ?? "").trim();
    const where = search
      ? { name: { [Op.like]: `%${search}%` } }
      : undefined;

    const { count, rows } = await Category.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load brands",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const createAdminBrand = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const payload = req.body as {
      name: string;
      description?: string;
      image?: string;
    };
    const brand = await Category.create({
      name: payload.name,
      description: payload.description ?? null,
      image: payload.image ?? null,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Brand created",
      data: brand,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create brand",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const updateAdminBrand = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const brand = await Category.findByPk(id);
    if (!brand) {
      res.status(404).json({
        success: false,
        message: "Brand not found",
      });
      return;
    }

    await brand.update(req.body);
    res.json({
      success: true,
      message: "Brand updated",
      data: brand,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update brand",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const deleteAdminBrand = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const brand = await Category.findByPk(id);
    if (!brand) {
      res.status(404).json({
        success: false,
        message: "Brand not found",
      });
      return;
    }

    await brand.destroy();
    res.json({
      success: true,
      message: "Brand deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete brand",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const getAdminCoupons = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationQuery(req);
    const search = String(req.query.search ?? "").trim();
    const where = search
      ? {
          [Op.or]: [{ code: { [Op.like]: `%${search}%` } }],
        }
      : undefined;

    const { count, rows } = await Coupon.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load coupons",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const createAdminCoupon = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const payload = req.body as {
      code: string;
      type: CouponType;
      value: number;
      minOrderValue: number;
      maxDiscountValue?: number;
      startDate: string;
      endDate: string;
      usageLimit: number;
      isActive?: boolean;
    };

    const coupon = await Coupon.create({
      code: payload.code.trim().toUpperCase(),
      type: payload.type,
      value: payload.value,
      minOrderValue: payload.minOrderValue ?? 0,
      maxDiscountValue: payload.maxDiscountValue ?? null,
      startDate: new Date(payload.startDate),
      endDate: new Date(payload.endDate),
      usageLimit: payload.usageLimit ?? 100,
      isActive: payload.isActive ?? true,
    });

    res.status(201).json({
      success: true,
      message: "Coupon created",
      data: coupon,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create coupon",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const updateAdminCoupon = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const coupon = await Coupon.findByPk(id);
    if (!coupon) {
      res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
      return;
    }

    const payload = req.body as {
      code?: string;
      type?: CouponType;
      value?: number;
      minOrderValue?: number;
      maxDiscountValue?: number | null;
      startDate?: string;
      endDate?: string;
      usageLimit?: number;
      isActive?: boolean;
    };

    await coupon.update({
      ...(payload.code != null ? { code: payload.code.trim().toUpperCase() } : {}),
      ...(payload.type != null ? { type: payload.type } : {}),
      ...(payload.value != null ? { value: payload.value } : {}),
      ...(payload.minOrderValue != null
        ? { minOrderValue: payload.minOrderValue }
        : {}),
      ...(payload.maxDiscountValue !== undefined
        ? { maxDiscountValue: payload.maxDiscountValue }
        : {}),
      ...(payload.startDate != null ? { startDate: new Date(payload.startDate) } : {}),
      ...(payload.endDate != null ? { endDate: new Date(payload.endDate) } : {}),
      ...(payload.usageLimit != null ? { usageLimit: payload.usageLimit } : {}),
      ...(payload.isActive != null ? { isActive: payload.isActive } : {}),
    });

    res.json({
      success: true,
      message: "Coupon updated",
      data: coupon,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update coupon",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const deleteAdminCoupon = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const coupon = await Coupon.findByPk(id);
    if (!coupon) {
      res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
      return;
    }

    await coupon.destroy();
    res.json({
      success: true,
      message: "Coupon deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const getAdminReviews = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationQuery(req);
    const search = String(req.query.search ?? "").trim();
    const isVisibleQuery = req.query.isVisible;
    const parsedIsVisible =
      isVisibleQuery === undefined
        ? undefined
        : String(isVisibleQuery).toLowerCase() === "true";
    const where: Record<string, unknown> = {};
    if (search) {
      where.comment = { [Op.like]: `%${search}%` };
    }
    if (parsedIsVisible !== undefined) {
      where.isVisible = parsedIsVisible;
    }

    const { count, rows } = await Review.findAndCountAll({
      where: Object.keys(where).length === 0 ? undefined : (where as any),
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        { model: Product, as: "product", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load reviews",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const updateAdminReviewVisibility = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { isVisible } = req.body as { isVisible: boolean };
    const review = await Review.findByPk(id);
    if (!review) {
      res.status(404).json({ success: false, message: "Review not found" });
      return;
    }
    review.isVisible = Boolean(isVisible);
    await review.save();
    res.json({ success: true, message: "Review visibility updated", data: review });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update review visibility",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const replyAdminReview = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { adminReply } = req.body as { adminReply: string };
    const review = await Review.findByPk(id);
    if (!review) {
      res.status(404).json({ success: false, message: "Review not found" });
      return;
    }
    review.adminReply = adminReply?.trim() || null;
    await review.save();
    res.json({ success: true, message: "Review replied", data: review });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to reply review",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const getAdminUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, offset } = getPaginationQuery(req);
    const role = String(req.query.role ?? "USER").toUpperCase();
    const search = String(req.query.search ?? "").trim();

    const where: Record<string, unknown> = { role };
    if (search) {
      where[Op.or as unknown as string] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: ["id", "name", "email", "phone", "isVerified", "role", "createdAt"],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load users",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const setAdminUserVerified = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { isVerified } = req.body as { isVerified: boolean };
    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    user.isVerified = Boolean(isVerified);
    await user.save();

    res.json({
      success: true,
      message: "User status updated",
      data: {
        id: user.id,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update user status",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const createAdminStaff = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const payload = req.body as {
      name: string;
      email: string;
      password: string;
      phone?: string;
    };

    const existed = await User.findOne({ where: { email: payload.email } });
    if (existed) {
      res.status(400).json({
        success: false,
        message: "Email already exists",
      });
      return;
    }

    const hashed = await bcrypt.hash(payload.password, 10);
    const staff = await User.create({
      name: payload.name,
      email: payload.email,
      password: hashed,
      phone: payload.phone ?? null,
      role: "ADMIN",
      isVerified: true,
    });

    res.status(201).json({
      success: true,
      message: "Staff created",
      data: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        isVerified: staff.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create staff",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const updateAdminStaff = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const payload = req.body as {
      name?: string;
      phone?: string;
      isVerified?: boolean;
    };

    const staff = await User.findByPk(id);
    if (!staff || staff.role !== "ADMIN") {
      res.status(404).json({
        success: false,
        message: "Staff not found",
      });
      return;
    }

    if (payload.name !== undefined) staff.name = payload.name;
    if (payload.phone !== undefined) staff.phone = payload.phone;
    if (payload.isVerified !== undefined) {
      staff.isVerified = Boolean(payload.isVerified);
    }

    await staff.save();
    res.json({
      success: true,
      message: "Staff updated",
      data: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        isVerified: staff.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update staff",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const deleteAdminStaff = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const staff = await User.findByPk(id);
    if (!staff || staff.role !== "ADMIN") {
      res.status(404).json({
        success: false,
        message: "Staff not found",
      });
      return;
    }

    await staff.destroy();
    res.json({
      success: true,
      message: "Staff deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete staff",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const getAdminReportSummary = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const period = String(req.query.period ?? "month") as "day" | "month" | "year";
    const from = req.query.from?.toString();
    const to = req.query.to?.toString();
    const { start, end } = getPeriodRange(period, from, to);

    const whereRange = {
      createdAt: { [Op.gte]: start, [Op.lt]: end },
    } as any;

    const [revenue, totalOrders, totalUsers, groupedStatuses, topProducts] =
      await Promise.all([
        Order.sum("total", {
          where: {
            ...whereRange,
            status: { [Op.notIn]: [OrderStatus.CANCELLED] },
          } as any,
        }),
        Order.count({ where: whereRange }),
        User.count({
          where: { createdAt: { [Op.gte]: start, [Op.lt]: end } } as any,
        }),
        Order.findAll({
          attributes: [
            "status",
            [Order.sequelize!.fn("COUNT", Order.sequelize!.col("id")), "count"],
          ],
          where: whereRange,
          group: ["status"],
          raw: true,
        }),
        OrderItem.findAll({
          attributes: [
            "productId",
            [
              OrderItem.sequelize!.fn(
                "SUM",
                OrderItem.sequelize!.col("quantity"),
              ),
              "soldQty",
            ],
          ],
          include: [
            {
              model: Order,
              as: "order",
              attributes: [],
              where: whereRange,
            },
            {
              model: Product,
              as: "product",
              attributes: ["id", "name"],
            },
          ],
          group: ["productId", "product.id"],
          order: [[OrderItem.sequelize!.literal("soldQty"), "DESC"]],
          limit: 5,
        }),
      ]);

    const revenueValue = toNumber(revenue);
    const aov = totalOrders > 0 ? revenueValue / totalOrders : 0;

    res.json({
      success: true,
      data: {
        period,
        from: start.toISOString(),
        to: end.toISOString(),
        totals: {
          revenue: revenueValue,
          orders: totalOrders,
          users: totalUsers,
          aov: Number(aov.toFixed(2)),
        },
        statuses: (groupedStatuses as unknown as Array<{ status: string; count: string }>).map(
          (s) => ({ status: s.status, count: Number(s.count) }),
        ),
        topProducts: topProducts.map((item: any) => ({
          productId: item.productId,
          name: item.product?.name ?? "Unknown",
          soldQty: Number(item.get("soldQty") ?? 0),
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load report summary",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const exportAdminReport = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const format = String(req.query.format ?? "excel");
    const period = String(req.query.period ?? "month") as "day" | "month" | "year";
    const from = req.query.from?.toString();
    const to = req.query.to?.toString();
    const { start, end } = getPeriodRange(period, from, to);

    const whereRange = {
      createdAt: { [Op.gte]: start, [Op.lt]: end },
    } as any;

    const orders = await Order.findAll({
      where: whereRange,
      include: [{ model: User, as: "user", attributes: ["name", "email"] }],
      order: [["createdAt", "DESC"]],
    });

    if (format === "word") {
      const lines = [
        `REPORT PERIOD: ${period.toUpperCase()}`,
        `FROM: ${start.toISOString()}`,
        `TO: ${end.toISOString()}`,
        "",
        "ORDERS",
        ...orders.map(
          (o: any) =>
            `${o.orderCode} | ${o.status} | ${toNumber(o.total)} | ${o.user?.name ?? ""} | ${o.user?.email ?? ""}`,
        ),
      ];
      const content = lines.join("\n");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="report.doc"');
      res.send(content);
      return;
    }

    const header = "orderCode,status,total,customerName,customerEmail,createdAt";
    const rows = orders.map((o: any) =>
      [
        o.orderCode,
        o.status,
        toNumber(o.total),
        (o.user?.name ?? "").replace(/,/g, " "),
        (o.user?.email ?? "").replace(/,/g, " "),
        o.createdAt?.toISOString?.() ?? "",
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="report.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to export report",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};
