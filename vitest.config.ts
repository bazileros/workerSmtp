import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["packages/api/src/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**", ".bun/**"],
  },
});
