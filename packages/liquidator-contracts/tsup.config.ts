import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "abi/index": "src/abi/index.ts",
    "bytecode/index": "src/bytecode/index.ts",
  },
  outDir: "dist",
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "node24",
}) as unknown;
