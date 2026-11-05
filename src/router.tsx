import type { RouteObject } from "react-router";

import { RequireAuth } from "@/components/RequireAuth";
import { RootLayout, RouteErrorPage, NotFoundPage } from "@/routes/root";
import { LandingPage } from "@/routes/index";
import { AuthPage, LegacyAuthRedirect } from "@/routes/auth";
import { AppPage } from "@/routes/app";

// Client-side route table. Every path is served index.html by the host
// (see vercel.json), and React Router resolves it in the browser.
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "sign-in", element: <AuthPage mode="signin" /> },
      { path: "sign-up", element: <AuthPage mode="signup" /> },
      // Old links (/auth, /auth?mode=signup) keep working.
      { path: "auth", element: <LegacyAuthRedirect /> },
      {
        element: <RequireAuth />,
        children: [{ path: "app", element: <AppPage /> }],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];
