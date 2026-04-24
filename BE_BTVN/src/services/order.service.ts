import { Op, Transaction } from "sequelize";
import sequelize from "../config/database";
import {
  Cart,
  CartItem,
  Order,
  OrderItem,
  Product,
  Payment,
  User,
  Coupon,
} from "../models";
import { validateCoupon } from "./coupon.service";
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../models/order.model";
import {
  PaymentProvider,
  PaymentTxnStatus,
} from "../models/payment.model";
import { createPayment as createMomoPayment } from "./momo.service";
import emailService from "./email.service";
import { isStatusEmailEligible } from "../utils/order-email.template";

export interface CreateOrderInput {
  userId: number;
  paymentMethod: PaymentMethod;
  shippingAddress: string;
  receiverName: string;
  receiverPhone: string;
  note?: string;
  couponCode?: string;
}

export interface CreateOrderResult {
  orderId: number;
  orderCode: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
}

export class OrderError extends Error {
  public readonly statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Create order from the user's cart, atomically deducting stock and clearing cart.
 * For MOMO, also calls MoMo API and returns a payUrl the client opens.
 */
export async function createOrderFromCart(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const transaction = await sequelize.transaction();

  try {
    const cart = await Cart.findOne({
      where: { userId: input.userId },
      include: [
        {
          model: CartItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
      ],
      transaction,
    });

    const items = (cart as any)?.items || [];
    if (!cart || items.length === 0) {
      throw new OrderError("Cart is empty", 400);
    }

    for (const item of items) {
      if (item.product.stock < item.quantity) {
        throw new OrderError(
          `Product "${item.product.name}" has only ${item.product.stock} items in stock`,
          400,
        );
      }
    }

    const total = items.reduce(
      (sum: number, item: any) =>
        sum + item.quantity * parseFloat(item.product.price),
      0,
    );

    const normalizedCouponCode = input.couponCode?.trim().toUpperCase();
    let discount = 0;
    let coupon: Coupon | undefined;

    if (normalizedCouponCode) {
      const validation = await validateCoupon(normalizedCouponCode, total);
      if (!validation.isValid) {
        throw new OrderError(validation.message || "Mã khuyến mãi không hợp lệ", 400);
      }
      discount = validation.discountAmount;
      coupon = validation.coupon;
    }

    const orderCode = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const order = await Order.create(
      {
        userId: input.userId,
        orderCode,
        couponCode: discount > 0 ? (normalizedCouponCode ?? coupon?.code ?? null) : null,
        total,
        discount,
        paymentMethod: input.paymentMethod,
        paymentStatus:
          input.paymentMethod === PaymentMethod.COD
            ? PaymentStatus.UNPAID
            : PaymentStatus.UNPAID,
        status: OrderStatus.PENDING,
        shippingAddress: input.shippingAddress,
        receiverName: input.receiverName,
        receiverPhone: input.receiverPhone,
        note: input.note || null,
      },
      { transaction },
    );

    if (coupon) {
      await coupon.increment("usedCount", { by: 1, transaction });
    }

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

    const result: CreateOrderResult = {
      orderId: order.id,
      orderCode: order.orderCode,
      total: parseFloat(order.total.toString()),
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
    };

    if (input.paymentMethod === PaymentMethod.MOMO) {
      // If MoMo is down or returns non-zero, DO NOT fail the whole checkout —
      // the order is already persisted. Return it without payUrl so the FE
      // lands on OrderDetail where "Thanh toán lại" can retry.
      try {
        const momo = await initiateMomoForOrder(order.id);
        result.payUrl = momo.payUrl;
        result.deeplink = momo.deeplink;
        result.qrCodeUrl = momo.qrCodeUrl;
      } catch (err) {
        console.error("MoMo init during checkout failed:", err);
      }
    }

    return result;
  } catch (error) {
    if (!(transaction as any).finished) {
      await transaction.rollback();
    }
    throw error;
  }
}

/**
 * Call MoMo create API for an existing order. Usable for retry.
 * The order must be unpaid and in PENDING status.
 */
export async function initiateMomoForOrder(orderId: number): Promise<{
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
  requestId: string;
}> {
  const order = await Order.findByPk(orderId);
  if (!order) throw new OrderError("Order not found", 404);
  if (order.paymentMethod !== PaymentMethod.MOMO) {
    throw new OrderError("Order is not MoMo-paid", 400);
  }
  if (order.paymentStatus === PaymentStatus.PAID) {
    throw new OrderError("Order already paid", 409);
  }

  // Reset FAILED → UNPAID so the FE WebView doesn't show "failed" from a prior attempt.
  if (order.paymentStatus === PaymentStatus.FAILED) {
    order.paymentStatus = PaymentStatus.UNPAID;
    await order.save();
  }

  const amount = Math.round(
    parseFloat(order.total.toString()) - parseFloat(order.discount.toString()),
  );
  // MoMo orderId must be unique per call — combine orderCode with a timestamp.
  const momoOrderId = `${order.orderCode}-${Date.now()}`;

  const { request, response } = await createMomoPayment({
    orderId: momoOrderId,
    amount,
    orderInfo: `Thanh toan don hang ${order.orderCode}`,
    extraData: Buffer.from(
      JSON.stringify({ internalOrderId: order.id }),
      "utf8",
    ).toString("base64"),
  });

  await Payment.create({
    orderId: order.id,
    provider: PaymentProvider.MOMO,
    requestId: request.requestId,
    amount,
    status:
      response.resultCode === 0
        ? PaymentTxnStatus.PENDING
        : PaymentTxnStatus.FAILED,
    resultCode: response.resultCode,
    message: response.message,
    rawRequest: JSON.stringify(request),
    rawResponse: JSON.stringify(response),
  });

  if (response.resultCode !== 0) {
    throw new OrderError(
      `MoMo create failed: ${response.message}`,
      502,
    );
  }

  return {
    payUrl: response.payUrl,
    deeplink: response.deeplink,
    qrCodeUrl: response.qrCodeUrl,
    requestId: request.requestId,
  };
}

/**
 * Auto-confirm PENDING orders that are older than 30 minutes,
 * but only if they are COD or have been paid (MoMo/VNPay with PAID status).
 * Unpaid non-COD orders stay PENDING until the IPN arrives or the user cancels.
 */
export async function autoConfirmPendingOrders(userId?: number): Promise<void> {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const where: any = {
      status: OrderStatus.PENDING,
      createdAt: { [Op.lte]: thirtyMinutesAgo },
      [Op.or]: [
        { paymentMethod: PaymentMethod.COD },
        { paymentStatus: PaymentStatus.PAID },
      ],
    };
    if (userId) where.userId = userId;

    // Find eligible order IDs first so we can notify each user after the bulk update.
    const eligible = await Order.findAll({ where, attributes: ["id"] });
    if (eligible.length === 0) return;

    await Order.update({ status: OrderStatus.CONFIRMED }, { where });

    for (const o of eligible) {
      void notifyOrderStatus(o.id, OrderStatus.CONFIRMED);
    }
  } catch (error) {
    console.error("Auto-confirm error:", error);
  }
}

/**
 * Mark an order as PAID (idempotent). Called from the MoMo IPN handler.
 */
export async function markOrderPaid(
  orderId: number,
  transId: string,
  options: { transaction?: Transaction } = {},
): Promise<void> {
  const order = await Order.findByPk(orderId, { transaction: options.transaction });
  if (!order) throw new OrderError("Order not found", 404);
  if (order.paymentStatus === PaymentStatus.PAID) return; // idempotent

  order.paymentStatus = PaymentStatus.PAID;
  order.transId = transId;
  const transitionedToConfirmed = order.status === OrderStatus.PENDING;
  if (transitionedToConfirmed) {
    order.status = OrderStatus.CONFIRMED;
  }
  await order.save({ transaction: options.transaction });

  if (transitionedToConfirmed) {
    void notifyOrderStatus(order.id, OrderStatus.CONFIRMED);
  }
}

/**
 * Mark a MoMo payment attempt as failed. Order stays PENDING so the user
 * can retry payment or cancel.
 */
export async function markPaymentFailed(
  orderId: number,
  reason: string,
): Promise<void> {
  const order = await Order.findByPk(orderId);
  if (!order) return;
  if (order.paymentStatus === PaymentStatus.PAID) return;
  order.paymentStatus = PaymentStatus.FAILED;
  order.note = order.note
    ? `${order.note} | Payment failed: ${reason}`
    : `Payment failed: ${reason}`;
  await order.save();
}

/**
 * Fire-and-forget: load order + user + items and send a status email.
 * Errors are logged but never thrown — email failures must not break the
 * state transition that triggered them.
 */
export async function notifyOrderStatus(
  orderId: number,
  status: OrderStatus,
): Promise<void> {
  if (!isStatusEmailEligible(status)) return;
  try {
    const order = await Order.findByPk(orderId, {
      include: [
        { model: User, as: "user", attributes: ["email", "name"] },
        {
          model: OrderItem,
          as: "items",
          include: [
            { model: Product, as: "product", attributes: ["name", "image"] },
          ],
        },
      ],
    });
    if (!order) return;
    const user = (order as any).user as { email?: string; name?: string } | undefined;
    if (!user?.email) return;

    const items = ((order as any).items as any[]).map((it) => ({
      name: it.product?.name || "Sản phẩm",
      quantity: it.quantity,
      unitPrice: parseFloat(String(it.unitPrice)),
      image: it.product?.image || null,
    }));

    await emailService.sendOrderStatusEmail(user.email, status, {
      orderCode: order.orderCode,
      receiverName: order.receiverName,
      receiverPhone: order.receiverPhone,
      shippingAddress: order.shippingAddress,
      total: parseFloat(String(order.total)),
      paymentMethod: order.paymentMethod,
      items,
      createdAt: order.createdAt,
    });
  } catch (err) {
    console.error("notifyOrderStatus error:", err);
  }
}

/**
 * Update order status with side effects: persist + fire email notification.
 * Returns the new status. Safe to call repeatedly with the same status
 * (email dedupes via isStatusEmailEligible).
 */
export async function setOrderStatus(
  orderId: number,
  newStatus: OrderStatus,
  options: { cancellationReason?: string; transaction?: Transaction } = {},
): Promise<Order> {
  const order = await Order.findByPk(orderId, {
    transaction: options.transaction,
  });
  if (!order) throw new OrderError("Order not found", 404);

  const previousStatus = order.status;
  order.status = newStatus;
  if (options.cancellationReason) {
    order.cancellationReason = options.cancellationReason;
  }
  await order.save({ transaction: options.transaction });

  if (previousStatus !== newStatus) {
    // Fire-and-forget outside the transaction boundary.
    void notifyOrderStatus(order.id, newStatus);
  }
  return order;
}

const CANCELLABLE_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
] as const;

export function getCanCancel(order: any): "direct" | "request" | "none" {
  if (!CANCELLABLE_STATUSES.includes(order.status)) return "none";
  const orderAge = Date.now() - new Date(order.createdAt).getTime();
  const thirtyMinutes = 30 * 60 * 1000;
  return orderAge <= thirtyMinutes ? "direct" : "request";
}
