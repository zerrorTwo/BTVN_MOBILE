import crypto from "crypto";
import { momoConfig } from "../config/momo.config";

export interface MomoCreatePaymentInput {
  orderId: string;
  amount: number;
  orderInfo: string;
  extraData?: string;
  requestId?: string;
  ipnUrl?: string;
  redirectUrl?: string;
}

export interface MomoCreatePaymentResult {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
}

export interface MomoIpnPayload {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  orderInfo: string;
  orderType: string;
  transId: number | string;
  resultCode: number;
  message: string;
  payType: string;
  responseTime: number;
  extraData: string;
  signature: string;
}

function hmacSha256(secret: string, raw: string): string {
  return crypto.createHmac("sha256", secret).update(raw).digest("hex");
}

export function buildCreateSignature(params: {
  accessKey: string;
  amount: number;
  extraData: string;
  ipnUrl: string;
  orderId: string;
  orderInfo: string;
  partnerCode: string;
  redirectUrl: string;
  requestId: string;
  requestType: string;
}): string {
  const raw =
    `accessKey=${params.accessKey}` +
    `&amount=${params.amount}` +
    `&extraData=${params.extraData}` +
    `&ipnUrl=${params.ipnUrl}` +
    `&orderId=${params.orderId}` +
    `&orderInfo=${params.orderInfo}` +
    `&partnerCode=${params.partnerCode}` +
    `&redirectUrl=${params.redirectUrl}` +
    `&requestId=${params.requestId}` +
    `&requestType=${params.requestType}`;
  return hmacSha256(momoConfig.secretKey, raw);
}

export function buildIpnSignature(payload: Omit<MomoIpnPayload, "signature">): string {
  const raw =
    `accessKey=${momoConfig.accessKey}` +
    `&amount=${payload.amount}` +
    `&extraData=${payload.extraData}` +
    `&message=${payload.message}` +
    `&orderId=${payload.orderId}` +
    `&orderInfo=${payload.orderInfo}` +
    `&orderType=${payload.orderType}` +
    `&partnerCode=${payload.partnerCode}` +
    `&payType=${payload.payType}` +
    `&requestId=${payload.requestId}` +
    `&responseTime=${payload.responseTime}` +
    `&resultCode=${payload.resultCode}` +
    `&transId=${payload.transId}`;
  return hmacSha256(momoConfig.secretKey, raw);
}

export function verifyIpnSignature(payload: MomoIpnPayload): boolean {
  const { signature, ...rest } = payload;
  if (!signature || typeof signature !== "string") return false;
  const expected = buildIpnSignature(rest);
  const a = Buffer.from(signature, "utf8");
  const b = Buffer.from(expected, "utf8");
  // timingSafeEqual requires equal length; short-circuit on mismatch.
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function createPayment(
  input: MomoCreatePaymentInput,
): Promise<{ request: any; response: MomoCreatePaymentResult }> {
  const requestId = input.requestId || `${momoConfig.partnerCode}-${Date.now()}`;
  const extraData = input.extraData || "";
  const ipnUrl = input.ipnUrl || momoConfig.ipnUrl;
  const redirectUrl = input.redirectUrl || momoConfig.redirectUrl;

  const signature = buildCreateSignature({
    accessKey: momoConfig.accessKey,
    amount: input.amount,
    extraData,
    ipnUrl,
    orderId: input.orderId,
    orderInfo: input.orderInfo,
    partnerCode: momoConfig.partnerCode,
    redirectUrl,
    requestId,
    requestType: momoConfig.requestType,
  });

  const body = {
    partnerCode: momoConfig.partnerCode,
    partnerName: "BE_BTVN",
    storeId: "BE_BTVN_STORE",
    accessKey: momoConfig.accessKey,
    requestId,
    amount: input.amount,
    orderId: input.orderId,
    orderInfo: input.orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType: momoConfig.requestType,
    signature,
    lang: "vi",
  };

  const res = await fetch(momoConfig.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as MomoCreatePaymentResult;
  return { request: body, response: json };
}
