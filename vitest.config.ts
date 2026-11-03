import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    coverage: {
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/index.ts"],
    },
  },
});
