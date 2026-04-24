import { Request, Response } from "express";
import { validationResult } from "express-validator";
import sequelize from "../config/database";
import { Order, OrderItem, Product } from "../models";
import { OrderStatus, PaymentStatus } from "../models/order.model";
import {
  createOrderFromCart,
  autoConfirmPendingOrders,
  getCanCancel,
  setOrderStatus,
  OrderError,
} from "../services/order.service";

/**
 * POST /api/v1/orders  (and /checkout)
 * Create an order from the current user's cart. For MoMo, also returns payUrl.
 */
export const checkout = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
      return;
    }

    const userId = (req as any).user.id;
    const result = await createOrderFromCart({
      userId,
      paymentMethod: req.body.paymentMethod,
      shippingAddress: req.body.shippingAddress,
      receiverName: req.body.receiverName,
      receiverPhone: req.body.receiverPhone,
      note: req.body.note,
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof OrderError) {
      res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
      return;
    }
    console.error("Checkout error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    await autoConfirmPendingOrders(userId);

    const { count, rows: orders } = await Order.findAndCountAll({
      where: { userId },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "image"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    const formattedOrders = orders.map((order: any) => ({
      id: order.id,
      orderCode: order.orderCode,
      total: parseFloat(order.total),
      discount: parseFloat(order.discount),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      transId: order.transId,
      status: order.status,
      canCancel: getCanCancel(order),
      shippingAddress: order.shippingAddress,
      receiverName: order.receiverName,
      receiverPhone: order.receiverPhone,
      note: order.note,
      cancellationReason: order.cancellationReason,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
        product: {
          id: item.product.id,
          name: item.product.name,
          image: item.product.image,
        },
      })),
    }));

    res.json({
      success: true,
      data: formattedOrders,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get orders",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const getOrderById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    await autoConfirmPendingOrders(userId);

    const order = await Order.findOne({
      where: { id, userId },
      include: [
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "image"],
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

    const formattedOrder = {
      id: order.id,
      orderCode: order.orderCode,
      total: parseFloat(order.total.toString()),
      discount: parseFloat(order.discount.toString()),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      transId: order.transId,
      status: order.status,
      canCancel: getCanCancel(order),
      shippingAddress: order.shippingAddress,
      receiverName: order.receiverName,
      receiverPhone: order.receiverPhone,
      note: order.note,
      cancellationReason: order.cancellationReason,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: (order as any).items.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice),
        product: {
          id: item.product.id,
          name: item.product.name,
          image: item.product.image,
        },
      })),
    };

    res.json({
      success: true,
      data: formattedOrder,
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get order",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const cancelOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const transaction = await sequelize.transaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
      return;
    }

    const userId = (req as any).user.id;
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const order = await Order.findOne({
      where: { id, userId },
      include: [{ model: OrderItem, as: "items" }],
      transaction,
    });

    if (!order) {
      await transaction.rollback();
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    // If a MoMo order was PAID, cancellation should go through the refund flow,
    // not the direct-cancel path. For now, block direct cancel of PAID orders.
    if (order.paymentStatus === PaymentStatus.PAID) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message:
          "Paid orders cannot be cancelled directly. Please request a refund.",
      });
      return;
    }

    const cancelMode = getCanCancel(order);

    if (cancelMode === "none") {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}`,
      });
      return;
    }

    if (cancelMode === "direct") {
      order.status = OrderStatus.CANCELLED;
      order.cancellationReason = cancellationReason;
      await order.save({ transaction });

      for (const item of (order as any).items) {
        await Product.increment("stock", {
          by: item.quantity,
          where: { id: item.productId },
          transaction,
        });
      }

      await transaction.commit();
      res.json({
        success: true,
        message: "Order cancelled successfully",
        data: { status: order.status },
      });
      return;
    }

    // cancelMode === "request"
    order.status = OrderStatus.CANCEL_REQUESTED;
    order.cancellationReason = cancellationReason;
    await order.save({ transaction });
    await transaction.commit();

    res.json({
      success: true,
      message: "Cancellation request sent to shop",
      data: { status: order.status },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Cancel order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

export const requestCancelOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
      return;
    }

    const userId = (req as any).user.id;
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const order = await Order.findOne({ where: { id, userId } });

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    if (
      order.status !== OrderStatus.SHIPPING
    ) {
      res.status(400).json({
        success: false,
        message:
          "Can only request cancellation for orders in SHIPPING status",
      });
      return;
    }

    order.status = OrderStatus.CANCEL_REQUESTED;
    order.cancellationReason = cancellationReason;
    await order.save();

    res.json({
      success: true,
      message: "Cancellation request sent successfully",
      data: { status: order.status },
    });
  } catch (error) {
    console.error("Request cancel order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to request order cancellation",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};

/**
 * PUT /api/v1/orders/:id/status — ADMIN ONLY (enforced by requireAdmin middleware).
 */
export const updateOrderStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    const orderId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id);

    try {
      const order = await setOrderStatus(orderId, status);
      res.json({
        success: true,
        message: "Order status updated successfully",
        data: { status: order.status },
      });
    } catch (err) {
      if (err instanceof OrderError) {
        res.status(err.statusCode).json({ success: false, message: err.message });
        return;
      }
      throw err;
    }
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};
