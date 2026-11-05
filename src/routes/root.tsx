import { useQueryClient } from "@tanstack/react-query";
import { Component, useEffect, type ErrorInfo, type ReactNode } from "react";
import { Link, Outlet, ScrollRestoration, useLocation, useRouteError } from "react-router";

import { reportLovableError } from "@/lib/lovable-error-reporting";
import { usePageMeta, type MetaTag } from "@/lib/page-meta";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";

export function RootLayout() {
  const queryClient = useQueryClient();
  const location = useLocation();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  return (
    <>
      {/* Keyed on the path so a crashed page recovers when the user navigates away. */}
      <AppErrorBoundary key={location.pathname}>
        <Outlet />
      </AppErrorBoundary>
      <Toaster theme="dark" />
      <ScrollRestoration />
    </>
  );
}

const notFoundMeta: MetaTag[] = [];

export function NotFoundPage() {
  usePageMeta("Flight Price Notifier", notFoundMeta);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

/** Catches render errors in a page; "Try again" re-renders it in place. */
class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  override state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown, _info: ErrorInfo) {
    console.error(error);
    reportLovableError(error, { boundary: "root_error_boundary" });
  }

  override render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}

/** Router-level fallback for errors outside a page (e.g. in the layout itself). */
export function RouteErrorPage() {
  const error = useRouteError();
  useEffect(() => {
    console.error(error);
    reportLovableError(error, { boundary: "router_error_element" });
  }, [error]);
  return <ErrorFallback onRetry={() => window.location.reload()} />;
}
