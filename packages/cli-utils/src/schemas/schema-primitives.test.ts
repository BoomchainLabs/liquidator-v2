import { describe, expect, it } from "vitest";

import { boolLike } from "./schema-primitives.js";

describe("boolLike schema", () => {
  it.each([
    { input: true, output: true },
    { input: false, output: false },
    { input: "true", output: true },
    { input: "false", output: false },
    { input: "TRUE", output: true },
    { input: "FALSE", output: false },
    { input: "1", output: true },
    { input: "0", output: false },
    { input: 1, output: true },
    { input: 0, output: false },
  ])("should correctly parse $input to $output", ({ input, output }) => {
    const result = boolLike().parse(input);
    expect(result).toBe(output);
  });
});
