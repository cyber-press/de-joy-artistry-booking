import crypto from "node:crypto";

export type Provider = "paystack" | "flutterwave";
export type PaymentMode = "test" | "live";
export type GatewaySettings = {
  activeProvider: Provider;
  paystackEnabled: boolean;
  flutterwaveEnabled: boolean;
  manualEnabled: boolean;
  mode: PaymentMode;
  manualLabel: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions: string;
};

const keyFor = (provider: Provider, mode: PaymentMode) => process.env[`${provider === "paystack" ? "PAYSTACK" : "FLUTTERWAVE"}_${mode.toUpperCase()}_SECRET_KEY`] || "";
export const gatewayReadiness = (settings: GatewaySettings) => ({
  paystack: { enabled: settings.paystackEnabled, configured: Boolean(keyFor("paystack", settings.mode)) },
  flutterwave: { enabled: settings.flutterwaveEnabled, configured: Boolean(keyFor("flutterwave", settings.mode)) },
  manual: { enabled: settings.manualEnabled, configured: Boolean(settings.bankName && settings.accountName && settings.accountNumber) },
});
export const paymentReference = (provider: Provider, orderNumber: string | number) => `dejoy_${provider}_${orderNumber}_${crypto.randomBytes(8).toString("hex")}`;

async function providerRequest(url: string, secret: string, init?: RequestInit) {
  if (!secret) throw new Error("The selected payment gateway is not configured");
  const response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json", ...init?.headers } });
  const data = await response.json().catch(() => ({})) as any;
  if (!response.ok || data.status === false) throw new Error(data.message || "Payment gateway request failed");
  return data;
}

export async function initializeGateway(input: { provider: Provider; mode: PaymentMode; email: string; amount: number; currency: string; reference: string; callbackUrl: string; customerName: string; orderNumber: string }) {
  const secret = keyFor(input.provider, input.mode);
  if (input.provider === "paystack") {
    const result = await providerRequest("https://api.paystack.co/transaction/initialize", secret, { method: "POST", body: JSON.stringify({ email: input.email, amount: input.amount, currency: input.currency, reference: input.reference, callback_url: input.callbackUrl, metadata: { order_number: input.orderNumber } }) });
    return { checkoutUrl: result.data.authorization_url as string, providerId: result.data.access_code as string, raw: result.data };
  }
  const result = await providerRequest("https://api.flutterwave.com/v3/payments", secret, { method: "POST", body: JSON.stringify({ tx_ref: input.reference, amount: input.amount / 100, currency: input.currency, redirect_url: input.callbackUrl, customer: { email: input.email, name: input.customerName }, customizations: { title: "DE_JOY ARTISTRY", description: `Order #${input.orderNumber}` } }) });
  return { checkoutUrl: result.data.link as string, providerId: null, raw: result.data };
}

export async function verifyGateway(provider: Provider, mode: PaymentMode, identifier: string) {
  const secret = keyFor(provider, mode);
  const url = provider === "paystack" ? `https://api.paystack.co/transaction/verify/${encodeURIComponent(identifier)}` : `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(identifier)}/verify`;
  const result = await providerRequest(url, secret);
  const data = result.data;
  return { successful: data.status === "success", reference: provider === "paystack" ? data.reference : data.tx_ref, amountMinor: provider === "paystack" ? Number(data.amount) : Math.round(Number(data.amount) * 100), currency: data.currency, providerId: String(data.id || ""), raw: data };
}

export const validPaystackSignature = (rawBody: Buffer, signature: unknown) => {
  if (typeof signature !== "string" || !process.env.PAYSTACK_WEBHOOK_SECRET) return false;
  const expected = crypto.createHmac("sha512", process.env.PAYSTACK_WEBHOOK_SECRET).update(rawBody).digest("hex");
  return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
};
export const validFlutterwaveSignature = (signature: unknown) => { const expected=process.env.FLUTTERWAVE_WEBHOOK_HASH; return typeof signature === "string" && Boolean(expected) && signature.length === expected!.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected!)); };
