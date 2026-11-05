import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { usePageMeta, type MetaTag } from "@/lib/page-meta";

type Mode = "signin" | "signup";

const pageMeta: MetaTag[] = [
  { name: "description", content: "登入或註冊 Flight Price Notifier 帳號。" },
  { property: "og:title", content: "Sign in — Flight Price Notifier" },
  { property: "og:description", content: "Sign in or create your Flight Price Notifier account." },
  { property: "og:type", content: "website" },
  { name: "twitter:card", content: "summary" },
];

/** /auth and /auth?mode=signup from before the move to /sign-in and /sign-up. */
export function LegacyAuthRedirect() {
  const [params] = useSearchParams();
  return <Navigate to={params.get("mode") === "signup" ? "/sign-up" : "/sign-in"} replace />;
}

export function AuthPage({ mode }: { mode: Mode }) {
  usePageMeta("Sign in — Flight Price Notifier", pageMeta);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate("/app", { replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/app" } })
        : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      toast.success("請到信箱確認帳號 / Check your email to confirm.");
      return;
    }
    navigate("/app", { replace: true });
  }

  const isUp = mode === "signup";
  return (
    <div className="relative grid min-h-screen place-items-center bg-background px-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-hero" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-glow">
          <h1 className="text-2xl font-bold">{isUp ? "註冊 Sign up" : "登入 Sign in"}</h1>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} autoComplete={isUp ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading ? "…" : isUp ? "建立帳號 Create account" : "登入 Sign in"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isUp ? "已經有帳號？" : "還沒有帳號？"}{" "}
            <button type="button" className="text-primary-glow hover:underline" onClick={() => navigate(isUp ? "/sign-in" : "/sign-up", { replace: true })}>
              {isUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
        <p className="mt-6 text-center text-sm"><Link to="/" className="text-muted-foreground hover:text-foreground">← 回首頁 Back home</Link></p>
      </div>
    </div>
  );
}
