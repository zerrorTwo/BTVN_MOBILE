import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { Payment } from "../models";
import { PaymentTxnStatus } from "../models/payment.model";
import { verifyIpnSignature, MomoIpnPayload } from "../services/momo.service";
import {
  initiateMomoForOrder,
  markOrderPaid,
  markPaymentFailed,
  OrderError,
} from "../services/order.service";
import { Order } from "../models";

/**
 * POST /api/v1/payments/momo/init/:orderId (protected)
 * Generate (or regenerate) a MoMo payUrl for an existing order owned by the user.
 * Used when the first payUrl expired and the user wants to retry.
 */
export const initMomoPayment = async (
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
    const orderId = parseInt(String(req.params.orderId));

    const order = await Order.findOne({ where: { id: orderId, userId } });
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    const result = await initiateMomoForOrder(orderId);
    res.json({
      success: true,
      data: {
        orderId,
        payUrl: result.payUrl,
        deeplink: result.deeplink,
        qrCodeUrl: result.qrCodeUrl,
      },
    });
  } catch (error: any) {
    if (error instanceof OrderError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error("MoMo init error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create MoMo payment",
    });
  }
};

/**
 * POST /api/v1/payments/momo/ipn (public — called by MoMo server)
 * Verify signature and update order status.
 * MUST return 200 + { resultCode, message } or MoMo keeps retrying.
 */
export const momoIpn = async (req: Request, res: Response): Promise<void> => {
  const payload = req.body as MomoIpnPayload;

  try {
    if (!payload || !payload.signature) {
      res.status(200).json({ resultCode: 1, message: "Missing signature" });
      return;
    }

    if (!verifyIpnSignature(payload)) {
      console.warn("MoMo IPN signature invalid:", payload);
      res.status(200).json({ resultCode: 1, message: "Invalid signature" });
      return;
    }

    // Look up payment attempt by requestId to find our internal order.
    const paymentRow = await Payment.findOne({
      where: { requestId: payload.requestId },
    });
    if (!paymentRow) {
      res.status(200).json({ resultCode: 1, message: "Unknown requestId" });
      return;
    }

    paymentRow.status =
      payload.resultCode === 0
        ? PaymentTxnStatus.SUCCESS
        : PaymentTxnStatus.FAILED;
    paymentRow.transId = String(payload.transId);
    paymentRow.resultCode = payload.resultCode;
    paymentRow.message = payload.message;
    paymentRow.rawResponse = JSON.stringify(payload);
    await paymentRow.save();

    if (payload.resultCode === 0) {
      await markOrderPaid(paymentRow.orderId, String(payload.transId));
    } else {
      await markPaymentFailed(paymentRow.orderId, payload.message);
    }

    res.status(200).json({ resultCode: 0, message: "Received" });
  } catch (error: any) {
    console.error("MoMo IPN handler error:", error);
    res.status(200).json({ resultCode: 1, message: "Internal error" });
  }
};

/**
 * GET /api/v1/payments/momo/return (public — browser redirect from MoMo)
 * Not authoritative; just shows a page. Source of truth is the IPN.
 */
export const momoReturn = (req: Request, res: Response): void => {
  const { orderId, resultCode, message } = req.query;
  const success = String(resultCode) === "0";
  res
    .status(200)
    .setHeader("Content-Type", "text/html; charset=utf-8")
    .send(`
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Kết quả thanh toán MoMo</title>
<style>
  body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; background:#f3f4f6; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; }
  .card { background:#fff; padding:32px; border-radius:12px; box-shadow:0 6px 24px rgba(0,0,0,.08); text-align:center; max-width:420px; }
  .ok { color:#16a34a; } .fail { color:#dc2626; }
  h1 { margin:0 0 8px; font-size:20px; }
  p { color:#4b5563; margin:4px 0; }
</style>
</head>
<body>
  <div class="card">
    <h1 class="${success ? "ok" : "fail"}">
      ${success ? "Thanh toán thành công" : "Thanh toán thất bại"}
    </h1>
    <p>Mã giao dịch MoMo: ${String(orderId ?? "")}</p>
    <p>${String(message ?? "")}</p>
    <p style="margin-top:16px;color:#6b7280;">Bạn có thể quay lại ứng dụng.</p>
  </div>
</body>
</html>`);
};
