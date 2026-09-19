import { describe, expect, it } from "vitest";
import { buildLeetcodeUrl, parseLeetcodeUrl } from "@/lib/leetcode-url";

describe("leetcode-url", () => {
  it("parses standard LeetCode URLs", () => {
    expect(
      parseLeetcodeUrl("https://leetcode.com/problems/two-sum/"),
    ).toEqual({ slug: "two-sum" });
    expect(
      parseLeetcodeUrl("https://leetcode.com/problems/two-sum/description/"),
    ).toEqual({ slug: "two-sum" });
  });

  it("rejects invalid URLs", () => {
    expect(parseLeetcodeUrl("https://example.com/two-sum")).toBeNull();
    expect(parseLeetcodeUrl("not-a-url")).toBeNull();
  });

  it("builds LeetCode URLs", () => {
    expect(buildLeetcodeUrl("two-sum")).toBe(
      "https://leetcode.com/problems/two-sum/",
    );
  });
});
