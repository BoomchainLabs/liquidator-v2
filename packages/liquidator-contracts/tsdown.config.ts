import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    "abi/index": "src/abi/index.ts",
    "bytecode/index": "src/bytecode/index.ts",
  },
  outDir: "dist",
  format: ["esm"],
  fixedExtension: false,
  dts: true,
  sourcemap: true,
  clean: true,
  target: "node24",
});
