import { matchRoutes } from "react-router";
import { describe, expect, it } from "vitest";

import { routes } from "@/router";

// Match routes without rendering: pages talk to Supabase, which the test run lacks.
describe("App routing", () => {
  it.each(["/", "/app", "/sign-in", "/sign-up"])("matches a page for %s instead of not found", (path) => {
    const matches = matchRoutes(routes, path);

    expect(matches).not.toBeNull();
    expect(matches?.at(-1)?.route.path).not.toBe("*");
  });

  it("falls back to not found for unknown paths", () => {
    const matches = matchRoutes(routes, "/does-not-exist");

    expect(matches?.at(-1)?.route.path).toBe("*");
  });
});
