import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Check, Loader2, Plane } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PLANS,
  formatTwd,
  listSubscriptions,
  saveSubscription,
  type Plan,
  type Subscription,
} from "@/lib/flight-api";

/** The two route plans, each with a TWD target price and its subscribed state. */
export function PlanCards({ email }: { email: string }) {
  const subs = useQuery({
    queryKey: ["subscriptions", email],
    queryFn: () => listSubscriptions(email),
  });

  const byRoute = new Map((subs.data ?? []).map((s) => [s.route, s]));

  return (
    <section aria-labelledby="plans-heading" className="mt-10">
      <h2 id="plans-heading" className="text-2xl">
        選擇航線，設定目標價
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a route and a target price in TWD — we email you when the cheapest fare drops to it.
      </p>

      {subs.isError && (
        <p role="alert" className="mt-4 rounded-2xl border-2 border-destructive/40 bg-card p-4 text-sm">
          讀取訂閱失敗，請重新整理頁面。Couldn't load your subscriptions — please refresh.
        </p>
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.name}
            plan={plan}
            email={email}
            loading={subs.isPending}
            subscription={byRoute.get(plan.route)}
          />
        ))}
      </div>
    </section>
  );
}

function PlanCard({
  plan,
  email,
  loading,
  subscription,
}: {
  plan: Plan;
  email: string;
  loading: boolean;
  subscription?: Subscription;
}) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState("");
  const [editing, setEditing] = useState(false);
  const subscribed = Boolean(subscription);
  const showForm = !subscribed || editing;

  const save = useMutation({
    mutationFn: (target: number) => saveSubscription({ email, plan_name: plan.name, target_price: target }),
    onSuccess: (_data, target) => {
      // Flip the card straight away, then re-read the real rows.
      queryClient.setQueryData<Subscription[]>(["subscriptions", email], (prev = []) => {
        const now = new Date().toISOString();
        const row: Subscription = {
          email,
          route: plan.route,
          plan_name: plan.name,
          target_price: target,
          currency: "TWD",
          created_at: subscription?.created_at ?? now,
          updated_at: now,
        };
        return [...prev.filter((s) => s.route !== plan.route), row];
      });
      queryClient.invalidateQueries({ queryKey: ["subscriptions", email] });
      setEditing(false);
      setValue("");
      toast.success(subscribed ? "目標價已更新" : "開始追蹤！", {
        description: `${plan.title} · ${formatTwd(target)}`,
      });
    },
    onError: (err: Error) => toast.error("儲存失敗 Couldn't save", { description: err.message }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const target = Math.round(Number(value));
    if (!Number.isFinite(target) || target <= 0) {
      toast.error("請輸入大於 0 的目標價 (TWD)");
      return;
    }
    save.mutate(target);
  }

  const inputId = `target-${plan.name}`;

  return (
    <article className="flex flex-col rounded-3xl border-2 border-border bg-card p-6 shadow-glow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sky bg-knit shadow-glow">
            <Plane className="h-6 w-6 text-foreground" />
          </span>
          <div>
            <h3 className="text-xl">{plan.title}</h3>
            <p className="text-sm text-muted-foreground">{plan.en}</p>
          </div>
        </div>
        {subscribed && !editing && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-clay">
            <Check className="h-3.5 w-3.5" /> 已訂閱
          </span>
        )}
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> 載入中…
        </div>
      ) : showForm ? (
        <form onSubmit={onSubmit} className="mt-6 flex flex-1 flex-col">
          <label htmlFor={inputId} className="text-sm font-bold">
            目標價 Target price (TWD)
          </label>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm font-bold text-muted-foreground">NT$</span>
            <Input
              id={inputId}
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              required
              placeholder={subscription ? String(subscription.target_price) : "10000"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            近期最低票價約 {formatTwd(plan.hintTwd)} · Recent cheapest fare
          </p>
          <div className="mt-auto flex gap-2 pt-5">
            <Button type="submit" variant="hero" className="flex-1" disabled={save.isPending}>
              {save.isPending ? <Loader2 className="animate-spin" /> : <BellRing />}
              {subscribed ? "儲存目標價" : "開始追蹤"}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={save.isPending}>
                取消
              </Button>
            )}
          </div>
        </form>
      ) : (
        <div className="mt-6 flex flex-1 flex-col">
          <p className="text-sm text-muted-foreground">目前目標價 Current target</p>
          <p className="mt-1 text-3xl font-bold">{formatTwd(subscription!.target_price)}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            票價達標時會寄信到 {email}
          </p>
          <div className="mt-auto pt-5">
            <Button type="button" variant="outline" className="w-full" onClick={() => setEditing(true)}>
              更新目標價
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
