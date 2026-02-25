import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { Op } from "sequelize";
import sequelize from "../config/database";
import { Cart, CartItem, Order, OrderItem, Product } from "../models";
import { OrderStatus } from "../models/order.model";

/**
 * Auto-confirm PENDING orders that are older than 30 minutes.
 * Called before returning order lists/details to ensure status is up-to-date.
 */
const autoConfirmPendingOrders = async (userId?: number): Promise<void> => {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const where: any = {
      status: OrderStatus.PENDING,
      createdAt: { [Op.lte]: thirtyMinutesAgo },
    };
    if (userId) {
      where.userId = userId;
    }
    await Order.update({ status: OrderStatus.CONFIRMED }, { where });
  } catch (error) {
    console.error("Auto-confirm error:", error);
  }
};

/**
 * Returns the cancel capability for an order:
 * - "direct"  : within 30 min, PENDING/CONFIRMED/PREPARING → direct cancel (CANCELLED)
 * - "request" : after 30 min,  PENDING/CONFIRMED/PREPARING → cancel request (CANCEL_REQUESTED)
 * - "none"    : SHIPPING, COMPLETED, CANCELLED, CANCEL_REQUESTED → cannot cancel
 */
const CANCELLABLE_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
] as const;

const getCanCancel = (order: any): "direct" | "request" | "none" => {
  if (!CANCELLABLE_STATUSES.includes(order.status)) return "none";
  const orderAge = Date.now() - new Date(order.createdAt).getTime();
  const thirtyMinutes = 30 * 60 * 1000;
  return orderAge <= thirtyMinutes ? "direct" : "request";
};

export const checkout = async (req: Request, res: Response): Promise<void> => {
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
    const {
      paymentMethod,
      shippingAddress,
      receiverName,
      receiverPhone,
      note,
    } = req.body;

    const cart = await Cart.findOne({
      where: { userId },
      include: [
        {
          model: CartItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
      ],
      transaction,
    });

    if (!cart || !(cart as any).items || (cart as any).items.length === 0) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
      return;
    }

    const items = (cart as any).items;

    for (const item of items) {
      if (item.product.stock < item.quantity) {
        await transaction.rollback();
        res.status(400).json({
          success: false,
          message: `Product "${item.product.name}" has only ${item.product.stock} items in stock`,
        });
        return;
      }
    }

    const total = items.reduce(
      (sum: number, item: any) =>
        sum + item.quantity * parseFloat(item.product.price),
      0,
    );

    const orderCode = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const order = await Order.create(
      {
        userId,
        orderCode,
        total,
        discount: 0,
        paymentMethod,
        status: OrderStatus.PENDING,
        shippingAddress,
        receiverName,
        receiverPhone,
        note: note || null,
      },
      { transaction },
    );

    for (const item of items) {
      await OrderItem.create(
        {
          orderId: order.id,
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: parseFloat(item.product.price),
        },
        { transaction },
      );

      await Product.update(
        { stock: item.product.stock - item.quantity },
        { where: { id: item.product.id }, transaction },
      );
    }

    await CartItem.destroy({ where: { cartId: cart.id }, transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId: order.id,
        orderCode: order.orderCode,
        total: parseFloat(order.total.toString()),
        status: order.status,
      },
    });
  } catch (error) {
    await transaction.rollback();
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
      // Within 30 min: cancel directly and restore stock
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

    // cancelMode === "request": after 30 min → send cancel request
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
      order.status !== OrderStatus.PREPARING &&
      order.status !== OrderStatus.SHIPPING
    ) {
      res.status(400).json({
        success: false,
        message:
          "Can only request cancellation for orders in PREPARING or SHIPPING status",
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
    const order = await Order.findByPk(orderId);

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    order.status = status;
    await order.save();

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: { status: order.status },
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      errors: [error instanceof Error ? error.message : String(error)],
    });
  }
};
