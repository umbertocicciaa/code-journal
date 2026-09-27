import { describe, expect, it } from "vitest";
import { updateProblemCompaniesSchema } from "@/server/validation";

describe("updateProblemCompaniesSchema", () => {
  it("accepts a list of companies including an empty list", () => {
    expect(updateProblemCompaniesSchema.parse({ companies: [] })).toEqual({
      companies: [],
    });
    expect(
      updateProblemCompaniesSchema.parse({
        companies: [
          { slug: "google", name: "Google" },
          { slug: "amazon", name: "Amazon", frequency: 5 },
        ],
      }),
    ).toEqual({
      companies: [
        { slug: "google", name: "Google" },
        { slug: "amazon", name: "Amazon", frequency: 5 },
      ],
    });
  });

  it("rejects missing or invalid company entries", () => {
    expect(updateProblemCompaniesSchema.safeParse({}).success).toBe(false);
    expect(
      updateProblemCompaniesSchema.safeParse({
        companies: [{ slug: "", name: "Google" }],
      }).success,
    ).toBe(false);
    expect(
      updateProblemCompaniesSchema.safeParse({
        companies: [{ slug: "google", name: "" }],
      }).success,
    ).toBe(false);
  });
});
