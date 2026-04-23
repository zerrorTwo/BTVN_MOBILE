import fs from "fs";
import path from "path";
import crypto from "crypto";
import { buildOrderStatusEmail } from "./utils/order-email.template";
import { OrderStatus } from "./models/order.model";
import {
  buildCreateSignature,
  buildIpnSignature,
  verifyIpnSignature,
} from "./services/momo.service";
import { momoConfig } from "./config/momo.config";

const assert = (cond: any, msg: string) => {
  if (!cond) {
    console.error(`  ❌ FAIL: ${msg}`);
    process.exitCode = 1;
  } else {
    console.log(`  ✅ ${msg}`);
  }
};

const sampleOrder = {
  orderCode: "ORD1730456789123",
  receiverName: "Nguyễn Văn An",
  receiverPhone: "0901234567",
  shippingAddress: "123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. HCM",
  total: 458000,
  paymentMethod: "MOMO",
  createdAt: new Date(),
  items: [
    {
      name: "Áo thun nam cotton cao cấp",
      quantity: 2,
      unitPrice: 159000,
      image: "https://via.placeholder.com/60",
    },
    {
      name: "Quần jean nữ ống rộng",
      quantity: 1,
      unitPrice: 140000,
      image: "https://via.placeholder.com/60",
    },
  ],
};

function testEmailTemplates() {
  console.log("\n▶ Email templates");

  const confirmed = buildOrderStatusEmail(OrderStatus.CONFIRMED, sampleOrder);
  assert(confirmed !== null, "CONFIRMED template renders");
  assert(confirmed!.subject.includes("xác nhận"), "CONFIRMED subject includes 'xác nhận'");
  assert(confirmed!.html.includes(sampleOrder.orderCode), "CONFIRMED HTML contains order code");
  assert(confirmed!.html.includes("ĐÃ XÁC NHẬN"), "CONFIRMED HTML contains badge");
  assert(confirmed!.html.includes("458.000 ₫"), "CONFIRMED HTML contains formatted total");

  const shipping = buildOrderStatusEmail(OrderStatus.SHIPPING, sampleOrder);
  assert(shipping !== null, "SHIPPING template renders");
  assert(shipping!.subject.includes("đang được giao"), "SHIPPING subject includes 'đang được giao'");
  assert(shipping!.html.includes("ĐANG GIAO HÀNG"), "SHIPPING HTML contains badge");

  // Non-eligible statuses should return null
  const pending = buildOrderStatusEmail(OrderStatus.PENDING, sampleOrder);
  assert(pending === null, "PENDING returns null (not eligible)");
  const completed = buildOrderStatusEmail(OrderStatus.COMPLETED, sampleOrder);
  assert(completed === null, "COMPLETED returns null (not eligible)");

  // XSS safety
  const malicious = {
    ...sampleOrder,
    receiverName: "<script>alert(1)</script>",
    shippingAddress: "O'Brien & Sons <b>",
  };
  const safe = buildOrderStatusEmail(OrderStatus.CONFIRMED, malicious);
  assert(
    !safe!.html.includes("<script>"),
    "HTML-escapes <script> tag",
  );
  assert(
    safe!.html.includes("&lt;script&gt;"),
    "HTML-escapes < and > characters",
  );
  assert(
    safe!.html.includes("O&#39;Brien &amp; Sons"),
    "HTML-escapes quotes and ampersands",
  );

  // Persist HTML preview for visual review
  const outDir = path.resolve(__dirname, "..", "tmp");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "email-confirmed.html"),
    confirmed!.html,
    "utf8",
  );
  fs.writeFileSync(
    path.join(outDir, "email-shipping.html"),
    shipping!.html,
    "utf8",
  );
  console.log(`  📄 Preview: ${path.join(outDir, "email-confirmed.html")}`);
  console.log(`  📄 Preview: ${path.join(outDir, "email-shipping.html")}`);
}

function testMomoSignature() {
  console.log("\n▶ MoMo signature");

  // Build an expected signature using the documented raw string order
  const accessKey = momoConfig.accessKey;
  const secretKey = momoConfig.secretKey;
  const signature = buildCreateSignature({
    accessKey,
    amount: 100000,
    extraData: "",
    ipnUrl: "https://example.com/ipn",
    orderId: "ORD-1",
    orderInfo: "Test",
    partnerCode: momoConfig.partnerCode,
    redirectUrl: "https://example.com/return",
    requestId: "req-1",
    requestType: "captureWallet",
  });

  const raw =
    `accessKey=${accessKey}&amount=100000&extraData=&ipnUrl=https://example.com/ipn` +
    `&orderId=ORD-1&orderInfo=Test&partnerCode=${momoConfig.partnerCode}` +
    `&redirectUrl=https://example.com/return&requestId=req-1&requestType=captureWallet`;
  const expected = crypto.createHmac("sha256", secretKey).update(raw).digest("hex");

  assert(signature === expected, "buildCreateSignature matches HMAC-SHA256 of raw string");
  assert(/^[a-f0-9]{64}$/.test(signature), "Signature is 64-char hex");

  // IPN verify: build a payload, sign it, verify round-trips.
  const ipnPayload = {
    partnerCode: momoConfig.partnerCode,
    orderId: "ORD-1",
    requestId: "req-1",
    amount: 100000,
    orderInfo: "Test",
    orderType: "momo_wallet",
    transId: 2984723492,
    resultCode: 0,
    message: "Success",
    payType: "qr",
    responseTime: 1730456789000,
    extraData: "",
    signature: "",
  };
  ipnPayload.signature = buildIpnSignature(ipnPayload);
  assert(verifyIpnSignature(ipnPayload), "Valid IPN signature verifies");

  const tampered = { ...ipnPayload, amount: 999999 };
  assert(!verifyIpnSignature(tampered), "Tampered IPN (amount changed) fails verify");

  const badLen = { ...ipnPayload, signature: "abc" };
  assert(!verifyIpnSignature(badLen), "Different-length signature fails safely (no crash)");

  const missingSig = { ...ipnPayload, signature: "" };
  assert(!verifyIpnSignature(missingSig as any), "Empty signature fails safely");
}

function main() {
  console.log("🧪 Smoke test starting");
  testEmailTemplates();
  testMomoSignature();
  console.log(
    `\n${process.exitCode ? "❌ FAILED" : "✅ All smoke tests passed"}`,
  );
}

main();
