import { describe, expect, it } from "vitest";
import { updateProblemDescriptionSchema } from "@/server/validation";

describe("updateProblemDescriptionSchema", () => {
  it("accepts markdown descriptions including an empty string", () => {
    expect(updateProblemDescriptionSchema.parse({ descriptionMd: "" })).toEqual({
      descriptionMd: "",
    });
    expect(
      updateProblemDescriptionSchema.parse({
        descriptionMd: "## Two Sum\n\nGiven an array of integers...",
      }),
    ).toEqual({
      descriptionMd: "## Two Sum\n\nGiven an array of integers...",
    });
  });

  it("rejects missing or oversized descriptions", () => {
    expect(updateProblemDescriptionSchema.safeParse({}).success).toBe(false);
    expect(
      updateProblemDescriptionSchema.safeParse({
        descriptionMd: "x".repeat(100_001),
      }).success,
    ).toBe(false);
  });
});
