import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Radar } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useAuthedUser } from "@/components/RequireAuth";
import { usePageMeta, type MetaTag } from "@/lib/page-meta";
import { PlanCards } from "@/components/PlanCards";

const pageMeta: MetaTag[] = [
  { name: "description", content: "你的航線追蹤儀表板。" },
  { property: "og:title", content: "Dashboard — Flight Price Notifier" },
  { property: "og:description", content: "Your flight route tracking dashboard." },
  { property: "og:type", content: "website" },
  { name: "twitter:card", content: "summary" },
];

export function AppPage() {
  usePageMeta("Dashboard — Flight Price Notifier", pageMeta);
  const user = useAuthedUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();

  // ECPay returns here via the /ecpay-result redirect. The row is activated server-side by the
  // ReturnURL callback, so this is only a message + a refetch, never an activation.
  useEffect(() => {
    const purchase = params.get("purchase");
    if (!purchase) return;
    if (purchase === "success") {
      toast.success("付款完成！", { description: "訂閱啟用中，幾秒後卡片會顯示「已訂閱」。" });
      const t = setTimeout(() => queryClient.invalidateQueries({ queryKey: ["subscriptions"] }), 3000);
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setParams({}, { replace: true });
      return () => clearTimeout(t);
    }
    toast.error("付款未完成", { description: "可以在卡片上按「完成付款」再試一次。" });
    setParams({}, { replace: true });
  }, [params, setParams, queryClient]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate("/sign-in", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,var(--background)_0%,var(--background)_70%,var(--blush)_70%)]">
      <header className="border-b-2 border-border/60 bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="break-all text-3xl sm:text-4xl">Hi {user.email}</h1>
        {user.email ? (
          <PlanCards email={user.email.toLowerCase()} />
        ) : (
          <div className="mt-8 rounded-3xl border-2 border-dashed border-primary bg-card p-10 text-center shadow-glow">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sky bg-knit shadow-glow"><Radar className="h-8 w-8 text-foreground" /></span>
            <p className="mt-5 text-lg font-semibold">這個帳號沒有 email，無法寄送降價通知。</p>
            <p className="mt-2 text-sm text-muted-foreground">Price alerts need an email address on your account.</p>
          </div>
        )}
      </main>
    </div>
  );
}
