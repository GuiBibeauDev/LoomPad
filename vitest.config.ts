import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["packages/protocol/src/**/*.ts", "packages/sdk/src/**/*.ts"],
      exclude: ["**/*.test.ts", "packages/protocol/src/index.ts", "packages/protocol/src/types.ts"],
      thresholds: { statements: 70, branches: 65, functions: 75, lines: 70 }
    }
  }
});
