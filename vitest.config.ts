import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "tests/unit/**/*.test.ts",
      "tests/unit/problem-description-editor.test.tsx",
    ],
    environmentMatchGlobs: [
      ["tests/unit/problem-description-editor.test.tsx", "jsdom"],
    ],
    setupFiles: ["tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
