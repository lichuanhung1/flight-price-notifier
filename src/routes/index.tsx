import { Link } from "react-router";
import { Radar, BellRing, CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Reveal } from "@/components/Reveal";
import { usePageMeta, type MetaTag } from "@/lib/page-meta";

const pageMeta: MetaTag[] = [
  { name: "description", content: "設定航線與目標價，機票降價就通知你。Set a route and a target price — we email you when the fare drops." },
  { property: "og:title", content: "Flight Price Notifier — 機票降價通知" },
  { property: "og:description", content: "Set a route and a target price — we email you when the fare drops." },
  { property: "og:type", content: "website" },
  { name: "twitter:card", content: "summary_large_image" },
];

/** Yoga-mat tops, in the leg-warmer colors. */
const matColors = ["var(--primary)", "var(--sky)", "var(--tangerine)"];

const features = [
  { icon: Radar, title: "盯緊熱門航線", en: "Always-on route watching", body: "持續監控台北出發的熱門航線（東京、首爾），自動抓最低票價。" },
  { icon: BellRing, title: "達標自動通知", en: "Target-price email alerts", body: "低於你設定的目標價，就寄 email 提醒你，附上立即訂購連結。" },
  { icon: CalendarX, title: "隨時取消", en: "Cancel anytime", body: "月訂閱制，不想用隨時停，沒有綁約。" },
];

export function LandingPage() {
  usePageMeta("Flight Price Notifier — 機票降價通知", pageMeta);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b-2 border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Button asChild variant="hero">
            <Link to="/sign-in">Sign in / 登入</Link>
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-hero" />
        {/* Window mullions, like the gym window in the reference art. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[58%] bg-window opacity-50" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[58%] h-1.5 bg-floor opacity-70" />
        <div className="relative mx-auto grid max-w-6xl items-end gap-10 px-4 pt-20 pb-16 sm:px-6 sm:pt-28 md:grid-cols-[1fr_auto]">
          <Reveal>
            <p className="mb-6 inline-block rounded-full bg-sky px-4 py-1.5 text-sm font-bold text-foreground shadow-clay">
              TPE → NRT · HND · ICN
            </p>
            <h1 className="text-5xl leading-[1.05] font-bold sm:text-7xl">
              <span className="text-gradient">Flight Price Notifier</span>
            </h1>
            <p className="mt-8 max-w-xl text-xl font-bold sm:text-2xl">設定航線與目標價，機票降價就通知你</p>
            <p className="mt-3 max-w-xl text-foreground/75">Set a route and a target price — we email you when the fare drops.</p>
            <div className="mt-10">
              <Button asChild variant="hero" size="lg">
                <Link to="/sign-up">開始使用 Get started</Link>
              </Button>
            </div>
          </Reveal>
          {/* Stacked clay ring toy — purely decorative. */}
          <div aria-hidden className="mx-auto hidden w-44 flex-col items-center md:flex">
            <span className="h-10 w-24 rounded-full bg-primary bg-knit shadow-glow" />
            <span className="-mt-1 h-11 w-32 rounded-full bg-sky bg-knit shadow-glow" />
            <span className="-mt-1 h-12 w-40 rounded-full bg-tangerine bg-knit shadow-glow" />
            <span className="mt-1 h-3 w-44 rounded-full bg-foreground/15 blur-sm" />
          </div>
        </div>
        <div aria-hidden className="relative h-10 bg-floor" />
      </section>

      <section className="bg-floor px-4 pb-24 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 120}>
              <div className="h-full rounded-3xl border-t-[10px] bg-card p-7 shadow-glow transition-transform hover:-translate-y-1" style={{ borderTopColor: matColors[i % matColors.length] }}>
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl shadow-clay" style={{ backgroundColor: matColors[i % matColors.length] }}>
                  <f.icon className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="text-xl">{f.title}</h3>
                <p className="text-sm font-semibold text-muted-foreground">({f.en})</p>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-foreground/80">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <footer className="bg-floor py-8 text-center text-sm font-semibold text-primary-foreground">
        © 2026 Flight Price Notifier
      </footer>
    </div>
  );
}
