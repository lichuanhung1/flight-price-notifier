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

export type Subscription = {
  email: string;
  route: string;
  plan_name: PlanName;
  target_price: number;
  currency: "TWD";
  created_at: string;
  updated_at: string;
};

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

export async function saveSubscription(input: {
  email: string;
  plan_name: PlanName;
  target_price: number;
}): Promise<Subscription> {
  const res = await fetch(`${FLIGHT_API_URL}/subscribe`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as Subscription;
}

export const formatTwd = (n: number) => `NT$${n.toLocaleString("en-US")}`;
