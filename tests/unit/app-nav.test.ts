import { describe, expect, it } from "vitest";
import { APP_SHELL_NAV_ITEMS } from "@/lib/app-nav";
import { shouldWrapPublicProfileWithAppShell } from "@/lib/public-profile-shell";

describe("app shell navigation", () => {
  it("includes the primary app destinations", () => {
    const labels = APP_SHELL_NAV_ITEMS.map((item) => item.label);
    expect(labels).toEqual([
      "Journal",
      "Review",
      "Kanban",
      "Stats",
      "People",
      "Settings",
    ]);
  });

  it("uses app shell on public profiles for signed-in viewers", () => {
    expect(shouldWrapPublicProfileWithAppShell(true)).toBe(true);
    expect(shouldWrapPublicProfileWithAppShell(false)).toBe(false);
  });
});
