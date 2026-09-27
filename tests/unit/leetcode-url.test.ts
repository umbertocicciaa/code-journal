import { describe, expect, it } from "vitest";
import {
  buildLeetcodeUrl,
  buildNeetcodeUrl,
  buildProblemUrl,
  parseLeetcodeUrl,
  parseNeetcodeUrl,
  parseProblemUrl,
} from "@/lib/leetcode-url";

describe("leetcode-url", () => {
  it("parses standard LeetCode URLs", () => {
    expect(
      parseLeetcodeUrl("https://leetcode.com/problems/two-sum/"),
    ).toEqual({ slug: "two-sum" });
    expect(
      parseLeetcodeUrl("https://leetcode.com/problems/two-sum/description/"),
    ).toEqual({ slug: "two-sum" });
    expect(parseProblemUrl("https://leetcode.com/problems/two-sum/")).toEqual({
      source: "leetcode",
      slug: "two-sum",
    });
  });

  it("parses NeetCode URLs", () => {
    expect(
      parseNeetcodeUrl("https://neetcode.io/problems/two-integer-sum/"),
    ).toEqual({ slug: "two-integer-sum" });
    expect(
      parseNeetcodeUrl(
        "https://neetcode.io/problems/two-integer-sum?list=neetcode150",
      ),
    ).toEqual({ slug: "two-integer-sum" });
    expect(
      parseNeetcodeUrl(
        "https://neetcode.io/problems/counting-elements/question",
      ),
    ).toEqual({ slug: "counting-elements" });
    expect(parseProblemUrl("https://neetcode.io/problems/two-integer-sum/")).toEqual({
      source: "neetcode",
      slug: "two-integer-sum",
    });
  });

  it("rejects invalid URLs", () => {
    expect(parseLeetcodeUrl("https://example.com/two-sum")).toBeNull();
    expect(parseNeetcodeUrl("https://leetcode.com/problems/two-sum/")).toBeNull();
    expect(parseProblemUrl("https://example.com/two-sum")).toBeNull();
    expect(parseProblemUrl("not-a-url")).toBeNull();
  });

  it("builds platform URLs", () => {
    expect(buildLeetcodeUrl("two-sum")).toBe(
      "https://leetcode.com/problems/two-sum/",
    );
    expect(buildNeetcodeUrl("two-integer-sum")).toBe(
      "https://neetcode.io/problems/two-integer-sum/",
    );
    expect(buildProblemUrl("leetcode", "two-sum")).toBe(
      "https://leetcode.com/problems/two-sum/",
    );
    expect(buildProblemUrl("neetcode", "two-integer-sum")).toBe(
      "https://neetcode.io/problems/two-integer-sum/",
    );
  });
});
