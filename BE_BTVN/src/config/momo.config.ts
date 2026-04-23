import dotenv from "dotenv";

dotenv.config();

export const momoConfig = {
  partnerCode: process.env.MOMO_PARTNER_CODE || "MOMO",
  accessKey: process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85",
  secretKey:
    process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz",
  endpoint:
    process.env.MOMO_ENDPOINT ||
    "https://test-payment.momo.vn/v2/gateway/api/create",
  ipnUrl:
    process.env.MOMO_IPN_URL ||
    "https://your-public-host.ngrok.io/api/v1/payments/momo/ipn",
  redirectUrl:
    process.env.MOMO_REDIRECT_URL ||
    "https://your-public-host.ngrok.io/api/v1/payments/momo/return",
  requestType: process.env.MOMO_REQUEST_TYPE || "captureWallet",
};
