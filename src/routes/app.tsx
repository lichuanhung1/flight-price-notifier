import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Radar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useAuthedUser } from "@/components/RequireAuth";
import { usePageMeta, type MetaTag } from "@/lib/page-meta";

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

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate("/sign-in", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="break-all text-3xl font-bold sm:text-4xl">Hi {user.email}</h1>
        <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <Radar className="mx-auto h-10 w-10 text-primary-glow" />
          <p className="mt-4 text-lg">你的航線追蹤儀表板即將上線 — 下一個里程碑會加上訂閱航線的功能。</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Your dashboard is coming soon. Route-subscription will be added in the next milestone.
          </p>
        </div>
      </main>
    </div>
  );
}
