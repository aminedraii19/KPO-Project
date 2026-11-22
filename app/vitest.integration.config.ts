import path from "node:path";
import { defineConfig } from "vitest/config";

const root = path.resolve(import.meta.dirname);
export default defineConfig({
  root,
  resolve: { alias: {
    "@": path.resolve(root, "src"),
    "@contracts": path.resolve(root, "contracts"),
    "@db": path.resolve(root, "db"),
  } },
  test: {
    environment: "node",
    include: ["api/**/*.integration.test.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
