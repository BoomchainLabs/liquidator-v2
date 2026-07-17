import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { index: "src/index.ts", schema: "src/schemas/index.ts" },
  outDir: "dist",
  format: ["esm"],
  fixedExtension: false,
  dts: true,
  sourcemap: true,
  clean: true,
  target: "node24",
});
