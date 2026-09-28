import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("LICENSE", () => {
  it("ships the MIT license text", () => {
    const license = readFileSync("LICENSE", "utf8");
    expect(license).toContain("MIT License");
    expect(license).toContain("Permission is hereby granted");
  });
});
