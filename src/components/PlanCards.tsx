import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Check, Clock, CreditCard, Loader2, Plane, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PLANS,
  cancelSubscription,
  formatTwd,
  goToCheckout,
  isPaid,
  listSubscriptions,
  saveSubscription,
  type Plan,
  type Subscription,
} from "@/lib/flight-api";

/** Monthly fee shown on the cards; the charged amount comes from the server (flight/ecpay secret). */
const MONTHLY_FEE_TWD = 300;

/** The route plans, each with a TWD target price and a status-aware subscribed state. */
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
        月費 {formatTwd(MONTHLY_FEE_TWD)}，隨時取消。
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

function StatusBadge({ subscription }: { subscription: Subscription }) {
  const base = "inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-bold";
  switch (subscription.subscription_status) {
    case "active":
      return (
        <span className={`${base} bg-primary text-primary-foreground shadow-clay`}>
          <Check className="h-3.5 w-3.5" /> 已訂閱
        </span>
      );
    case "cancelled":
      return isPaid(subscription) ? (
        <span className={`${base} border-2 border-border bg-card`}>
          <Clock className="h-3.5 w-3.5" /> 已取消 · 有效至 {subscription.current_period_end_date}
        </span>
      ) : (
        <span className={`${base} border-2 border-border bg-card text-muted-foreground`}>已結束</span>
      );
    case "expired":
      return <span className={`${base} border-2 border-border bg-card text-muted-foreground`}>已結束</span>;
    default: // pending_payment, or a legacy M1 row with no status
      return (
        <span className={`${base} border-2 border-destructive/50 bg-card`}>
          <CreditCard className="h-3.5 w-3.5" /> 未完成付款
        </span>
      );
  }
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
  const paid = isPaid(subscription);
  const status = subscription?.subscription_status;
  const showForm = !subscription || editing;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["subscriptions", email] });

  const save = useMutation({
    mutationFn: (target: number) => saveSubscription({ email, plan_name: plan.name, target_price: target }),
    onSuccess: (result, target) => {
      if (result.kind === "checkout") {
        // New / unpaid: leave for ECPay's cashier. Payment is confirmed server-side by the callback.
        goToCheckout(result.html);
        return;
      }
      refresh();
      setEditing(false);
      setValue("");
      toast.success("目標價已更新", { description: `${plan.title} · ${formatTwd(target)}` });
    },
    onError: (err: Error) => toast.error("儲存失敗 Couldn't save", { description: err.message }),
  });

  const cancel = useMutation({
    mutationFn: () => cancelSubscription({ email, route: plan.route }),
    onSuccess: (r) => {
      refresh();
      toast.success("已取消訂閱", {
        description: r.current_period_end_date
          ? `不會再扣款；${r.current_period_end_date} 前仍會通知你。`
          : "不會再扣款。",
      });
    },
    onError: (err: Error) => toast.error("取消失敗 Couldn't cancel", { description: err.message }),
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

  function onCancel() {
    if (window.confirm(`確定要取消 ${plan.title} 的訂閱嗎？已付費的這一期仍會繼續通知你。`)) cancel.mutate();
  }

  const inputId = `target-${plan.name}`;
  const busy = save.isPending || cancel.isPending;

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
        {subscription && !editing && <StatusBadge subscription={subscription} />}
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
            <Button type="submit" variant="hero" className="flex-1" disabled={busy}>
              {save.isPending ? <Loader2 className="animate-spin" /> : paid ? <BellRing /> : <CreditCard />}
              {paid ? "儲存目標價" : `訂閱 ${formatTwd(MONTHLY_FEE_TWD)}/月`}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={busy}>
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
            {paid
              ? `票價達標時會寄信到 ${email}`
              : status === "expired" || status === "cancelled"
                ? "訂閱已結束，不會再收到通知。"
                : "完成付款後才會開始寄送降價通知。"}
          </p>
          <div className="mt-auto flex flex-col gap-2 pt-5">
            {paid ? (
              <>
                <Button type="button" variant="outline" className="w-full" onClick={() => setEditing(true)} disabled={busy}>
                  更新目標價
                </Button>
                {status === "active" && (
                  <Button type="button" variant="ghost" className="w-full" onClick={onCancel} disabled={busy}>
                    {cancel.isPending ? <Loader2 className="animate-spin" /> : <XCircle />} 取消訂閱
                  </Button>
                )}
              </>
            ) : (
              <Button
                type="button"
                variant="hero"
                className="w-full"
                disabled={busy}
                onClick={() => save.mutate(subscription!.target_price)}
              >
                {save.isPending ? <Loader2 className="animate-spin" /> : <CreditCard />}
                {status === "expired" || status === "cancelled" ? "重新訂閱" : "完成付款 / Pay"}
              </Button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
