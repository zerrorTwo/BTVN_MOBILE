import { OrderStatus } from "../models/order.model";

export interface OrderEmailItem {
  name: string;
  quantity: number;
  unitPrice: number;
  image?: string | null;
}

export interface OrderEmailData {
  orderCode: string;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  total: number;
  paymentMethod: string;
  items: OrderEmailItem[];
  createdAt: Date | string;
}

interface StatusMeta {
  heading: string;
  title: string;
  preview: string;
  intro: string;
  accent: string;
  accentDark: string;
  accentSoft: string;
  stepIndex: number;
  badge: string;
}

const STATUS_META: Partial<Record<OrderStatus, StatusMeta>> = {
  [OrderStatus.CONFIRMED]: {
    heading: "Đơn hàng đã được xác nhận",
    title: "Cảm ơn bạn, đơn hàng đã được xác nhận!",
    preview: "Đơn hàng của bạn đã được xác nhận và đang được chuẩn bị.",
    intro:
      "Chúng tôi đã nhận và xác nhận đơn hàng của bạn. Đội ngũ của chúng tôi đang chuẩn bị hàng và sẽ gửi đến bạn trong thời gian sớm nhất.",
    accent: "#0B5ED7",
    accentDark: "#0A4AA3",
    accentSoft: "#EAF3FF",
    stepIndex: 1,
    badge: "ĐÃ XÁC NHẬN",
  },
  [OrderStatus.SHIPPING]: {
    heading: "Đơn hàng đang được giao",
    title: "Đơn hàng của bạn đang trên đường!",
    preview: "Đơn hàng đang được giao — sẵn sàng đón nhận nhé!",
    intro:
      "Tin vui! Đơn hàng của bạn đã được bàn giao cho đơn vị vận chuyển và đang trên đường đến địa chỉ nhận hàng. Vui lòng giữ máy để shipper liên hệ khi cần.",
    accent: "#26AA99",
    accentDark: "#00897B",
    accentSoft: "#E8F7F3",
    stepIndex: 3,
    badge: "ĐANG GIAO HÀNG",
  },
};

const TIMELINE_STEPS = [
  { label: "Đã đặt", icon: "📝" },
  { label: "Xác nhận", icon: "✅" },
  { label: "Chuẩn bị", icon: "📦" },
  { label: "Đang giao", icon: "🚚" },
  { label: "Hoàn thành", icon: "🎉" },
];

const PAYMENT_LABEL: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng (COD)",
  MOMO: "Ví MoMo",
  VNPAY: "VNPay",
  ZALOPAY: "ZaloPay",
};

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatCurrency = (n: number): string =>
  new Intl.NumberFormat("vi-VN").format(Math.round(n)) + " ₫";

const formatDate = (d: Date | string): string => {
  const date = new Date(d);
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function isStatusEmailEligible(status: OrderStatus): boolean {
  return status in STATUS_META;
}

function renderItems(items: OrderEmailItem[]): string {
  return items
    .map((it) => {
      const img = it.image
        ? `<img src="${escapeHtml(it.image)}" alt="" width="60" height="60" style="border-radius:8px;display:block;object-fit:cover;" />`
        : `<div style="width:60px;height:60px;border-radius:8px;background:#f3f4f6;"></div>`;
      return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="72" valign="top" style="padding-right:12px;">${img}</td>
              <td valign="top" style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
                <div style="font-size:14px;color:#111827;font-weight:600;line-height:1.4;">
                  ${escapeHtml(it.name)}
                </div>
                <div style="font-size:12px;color:#6b7280;margin-top:4px;">
                  Số lượng: ${it.quantity}
                </div>
              </td>
              <td valign="top" align="right" style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:14px;color:#111827;font-weight:600;">
                ${formatCurrency(it.unitPrice * it.quantity)}
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    })
    .join("");
}

function renderTimeline(currentIndex: number, accent: string): string {
  return TIMELINE_STEPS.map((step, i) => {
    const done = i <= currentIndex;
    const bg = done ? accent : "#e5e7eb";
    const color = done ? "#ffffff" : "#9ca3af";
    const labelColor = done ? "#111827" : "#9ca3af";
    return `
      <td align="center" width="20%" style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
        <div style="width:36px;height:36px;line-height:36px;margin:0 auto;border-radius:50%;background:${bg};color:${color};font-size:16px;">
          ${step.icon}
        </div>
        <div style="font-size:11px;margin-top:6px;color:${labelColor};font-weight:${done ? 600 : 400};">
          ${step.label}
        </div>
      </td>`;
  }).join("");
}

export function buildOrderStatusEmail(
  status: OrderStatus,
  data: OrderEmailData,
): { subject: string; text: string; html: string } | null {
  const meta = STATUS_META[status];
  if (!meta) return null;

  const subject = `${meta.heading} #${data.orderCode}`;
  const paymentLabel = PAYMENT_LABEL[data.paymentMethod] || data.paymentMethod;

  const text =
    `Xin chào ${data.receiverName},\n\n` +
    `${meta.intro}\n\n` +
    `Mã đơn hàng: ${data.orderCode}\n` +
    `Tổng tiền: ${formatCurrency(data.total)}\n` +
    `Thanh toán: ${paymentLabel}\n` +
    `Giao đến: ${data.shippingAddress}\n\n` +
    `Cảm ơn bạn đã mua sắm tại DDNC Store.`;

  const itemsHtml = renderItems(data.items);
  const timelineHtml = renderTimeline(meta.stepIndex, meta.accent);

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(meta.heading)}</title>
  <style>
    @media only screen and (max-width:600px){
      .container{width:100% !important;}
      .hero-title{font-size:22px !important;}
      .card-pad{padding:20px !important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;-webkit-text-size-adjust:100%;">
  <!-- Preheader (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;">
    ${escapeHtml(meta.preview)}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.06);">

          <!-- HERO -->
          <tr>
            <td style="background:linear-gradient(135deg,${meta.accent} 0%,${meta.accentDark} 100%);padding:40px 30px 34px 30px;text-align:center;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
              <div style="display:inline-block;background:rgba(255,255,255,.18);padding:6px 14px;border-radius:999px;color:#ffffff;font-size:11px;font-weight:700;letter-spacing:.5px;">
                ${meta.badge}
              </div>
              <h1 class="hero-title" style="margin:16px 0 6px 0;color:#ffffff;font-size:26px;font-weight:700;line-height:1.3;">
                ${escapeHtml(meta.title)}
              </h1>
              <p style="margin:0;color:rgba(255,255,255,.88);font-size:14px;line-height:1.5;">
                Mã đơn: <strong>${escapeHtml(data.orderCode)}</strong>
              </p>
            </td>
          </tr>

          <!-- TIMELINE -->
          <tr>
            <td class="card-pad" style="padding:28px 30px 8px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  ${timelineHtml}
                </tr>
              </table>
            </td>
          </tr>

          <!-- GREETING -->
          <tr>
            <td class="card-pad" style="padding:20px 30px 0 30px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
              <p style="margin:0 0 8px 0;color:#111827;font-size:16px;font-weight:600;">
                Xin chào ${escapeHtml(data.receiverName)},
              </p>
              <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.6;">
                ${escapeHtml(meta.intro)}
              </p>
            </td>
          </tr>

          <!-- ORDER CARD -->
          <tr>
            <td class="card-pad" style="padding:20px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${meta.accentSoft};border-radius:12px;padding:16px;">
                <tr>
                  <td style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
                    <div style="font-size:11px;color:${meta.accentDark};font-weight:700;letter-spacing:.6px;text-transform:uppercase;">
                      Chi tiết đơn hàng
                    </div>
                    <div style="margin-top:8px;font-size:14px;color:#111827;line-height:1.8;">
                      <strong>Mã đơn:</strong> ${escapeHtml(data.orderCode)}<br/>
                      <strong>Ngày đặt:</strong> ${escapeHtml(formatDate(data.createdAt))}<br/>
                      <strong>Thanh toán:</strong> ${escapeHtml(paymentLabel)}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SHIPPING -->
          <tr>
            <td class="card-pad" style="padding:0 30px 20px 30px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
              <div style="font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px;">
                📍 Địa chỉ giao hàng
              </div>
              <div style="border:1px solid #e5e7eb;border-radius:12px;padding:14px 16px;">
                <div style="font-size:14px;color:#111827;font-weight:600;">${escapeHtml(data.receiverName)}</div>
                <div style="font-size:13px;color:#6b7280;margin-top:4px;">${escapeHtml(data.receiverPhone)}</div>
                <div style="font-size:13px;color:#374151;margin-top:4px;line-height:1.5;">${escapeHtml(data.shippingAddress)}</div>
              </div>
            </td>
          </tr>

          <!-- ITEMS -->
          <tr>
            <td class="card-pad" style="padding:0 30px 8px 30px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
              <div style="font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px;">
                🛒 Sản phẩm (${data.items.length})
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${itemsHtml}
              </table>
            </td>
          </tr>

          <!-- TOTAL -->
          <tr>
            <td class="card-pad" style="padding:16px 30px 20px 30px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:2px dashed #e5e7eb;padding-top:14px;">
                <tr>
                  <td style="font-size:16px;color:#111827;font-weight:700;">Tổng cộng</td>
                  <td align="right" style="font-size:22px;color:${meta.accent};font-weight:800;">
                    ${formatCurrency(data.total)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:0 30px 30px 30px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
              <div style="background:${meta.accentSoft};border-radius:12px;padding:18px;text-align:center;">
                <div style="font-size:13px;color:${meta.accentDark};font-weight:600;">
                  ${status === OrderStatus.SHIPPING
      ? "Vui lòng đảm bảo có người nhận hàng tại địa chỉ trên. Shipper sẽ gọi trước khi giao."
      : "Chúng tôi sẽ gửi email thông báo tiếp theo khi đơn hàng được giao."
    }
                </div>
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f9fafb;padding:20px 30px;text-align:center;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;border-top:1px solid #f3f4f6;">
              <div style="font-size:13px;color:#6b7280;font-weight:600;">
                DDNC Store
              </div>
              <div style="font-size:11px;color:#9ca3af;margin-top:6px;line-height:1.5;">
                Cảm ơn bạn đã mua sắm. Nếu có thắc mắc, vui lòng liên hệ đội ngũ hỗ trợ của chúng tôi.
              </div>
              <div style="font-size:11px;color:#9ca3af;margin-top:10px;">
                © ${new Date().getFullYear()} DDNC Store. Email này được gửi tự động, vui lòng không phản hồi.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}
