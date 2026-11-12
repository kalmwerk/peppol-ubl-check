import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    // The end-to-end tests run the compiled dist/ files in a fresh node process.
    testTimeout: 30_000,
  },
});
