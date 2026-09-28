import { describe, expect, it } from "vitest";
import { userSearchSchema } from "@/server/validation";

describe("userSearchSchema", () => {
  it("accepts a non-empty trimmed query", () => {
    expect(userSearchSchema.parse({ q: "  arcangelo  " })).toEqual({
      q: "arcangelo",
    });
  });

  it("rejects empty and whitespace-only queries", () => {
    expect(userSearchSchema.safeParse({ q: "" }).success).toBe(false);
    expect(userSearchSchema.safeParse({ q: "   " }).success).toBe(false);
  });

  it("rejects queries longer than 80 characters", () => {
    expect(userSearchSchema.safeParse({ q: "a".repeat(81) }).success).toBe(
      false,
    );
  });
});
