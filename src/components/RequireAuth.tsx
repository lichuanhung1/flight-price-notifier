import { useEffect, useState } from "react";
import { Navigate, Outlet, useOutletContext } from "react-router";
import type { User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

type AuthState = { status: "loading" } | { status: "signed-out" } | { status: "signed-in"; user: User };
type AuthContext = { user: User };

/**
 * Guards child routes: renders nothing while the session is checked, sends
 * signed-out visitors to /sign-in, and re-checks whenever the auth state
 * changes (e.g. sign-out in another tab).
 */
export function RequireAuth() {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    const check = () =>
      supabase.auth.getUser().then(({ data }) => {
        if (!active) return;
        setState(data.user ? { status: "signed-in", user: data.user } : { status: "signed-out" });
      });

    check();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      // Defer: calling Supabase auth methods inside this callback can deadlock.
      setTimeout(check, 0);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (state.status === "loading") return null;
  if (state.status === "signed-out") return <Navigate to="/sign-in" replace />;
  return <Outlet context={{ user: state.user } satisfies AuthContext} />;
}

/** The signed-in user, for pages rendered inside <RequireAuth />. */
export function useAuthedUser(): User {
  return useOutletContext<AuthContext>().user;
}
