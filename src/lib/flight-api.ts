// Client for the AWS side of the app (API Gateway → Lambda → DynamoDB).
// The browser holds no AWS credentials; it only calls these public endpoints.
// Supabase stays auth-only — subscriptions live in DynamoDB.

export const FLIGHT_API_URL: string =
  import.meta.env.VITE_FLIGHT_API_URL ?? "https://1sdsz9hx4b.execute-api.us-east-1.amazonaws.com";

export type PlanName = "tokyo" | "seoul";

export type Plan = {
  name: PlanName;
  route: string;
  title: string;
  en: string;
  /** A recent cheapest fare, shown as a hint so people pick a sensible budget. */
  hintTwd: number;
};

export const PLANS: Plan[] = [
  { name: "tokyo", route: "TPE-TYO", title: "台北 ✈ 東京", en: "Taipei → Tokyo", hintTwd: 9325 },
  { name: "seoul", route: "TPE-SEL", title: "台北 ✈ 首爾", en: "Taipei → Seoul", hintTwd: 5989 },
];

/** M2 lifecycle: pending_payment → active ⇄ (target updates) → cancelled (grace) → expired. */
export type SubscriptionStatus = "pending_payment" | "active" | "cancelled" | "expired";

export type Subscription = {
  email: string;
  route: string;
  plan_name: PlanName;
  target_price: number;
  currency: "TWD";
  created_at: string;
  updated_at: string;
  /** Missing on legacy M1 rows — treat those as unpaid. */
  subscription_status?: SubscriptionStatus;
  /** Paid-through date (YYYY-MM-DD); alerts continue until then even after cancelling. */
  current_period_end_date?: string;
};

/** A card only counts as paid-for while active, or cancelled but still inside the paid period. */
export function isPaid(s?: Subscription): boolean {
  if (!s) return false;
  if (s.subscription_status === "active") return true;
  if (s.subscription_status === "cancelled" && s.current_period_end_date) {
    return s.current_period_end_date >= new Date().toISOString().slice(0, 10);
  }
  return false;
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function listSubscriptions(email: string): Promise<Subscription[]> {
  const res = await fetch(`${FLIGHT_API_URL}/subscriptions?email=${encodeURIComponent(email)}`);
  if (!res.ok) throw new Error(await readError(res));
  const body = (await res.json()) as { subscriptions?: Subscription[] };
  return body.subscriptions ?? [];
}

export type SaveResult =
  /** New or unpaid subscription: the API returned ECPay's auto-submit checkout form. */
  | { kind: "checkout"; html: string }
  /** Already paid (active / cancelled-in-grace): the target price was updated in place. */
  | { kind: "updated"; target_price: number; subscription_status?: SubscriptionStatus };

export async function saveSubscription(input: {
  email: string;
  plan_name: PlanName;
  target_price: number;
}): Promise<SaveResult> {
  const res = await fetch(`${FLIGHT_API_URL}/subscribe`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  // Branch on Content-Type: calling res.json() on the HTML form would throw.
  if ((res.headers.get("content-type") ?? "").includes("text/html")) {
    return { kind: "checkout", html: await res.text() };
  }
  const body = (await res.json()) as { target_price: number; subscription_status?: SubscriptionStatus };
  return { kind: "updated", target_price: body.target_price, subscription_status: body.subscription_status };
}

/** Hand the browser to ECPay's cashier: the returned form auto-submits itself. */
export function goToCheckout(html: string) {
  document.open();
  document.write(html);
  document.close();
}

export async function cancelSubscription(input: { email: string; route: string }): Promise<{
  subscription_status: SubscriptionStatus;
  current_period_end_date?: string;
}> {
  const res = await fetch(`${FLIGHT_API_URL}/cancel`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return await res.json();
}

export const formatTwd = (n: number) => `NT$${n.toLocaleString("en-US")}`;
