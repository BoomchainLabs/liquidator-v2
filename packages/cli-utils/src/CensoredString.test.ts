import { expect, it } from "vitest";
import z4 from "zod/v4";

import { CensoredString } from "./CensoredString.js";

it("should censor long strings", () => {
  const v = new CensoredString(
    "______________________________0123456789abcdefghij",
  );
  expect(v.value).toBe("______________________________0123456789abcdefghij");
  expect(v.toString()).toBe("********ghij");
  const obj = { v };
  expect(JSON.stringify(obj)).toMatchInlineSnapshot(`"{"v":"********ghij"}"`);
});

it("should censor short strings", () => {
  const v = new CensoredString("0123");
  expect(v.value).toBe("0123");
  expect(v.toString()).toBe("****");
  const obj = { v };
  expect(JSON.stringify(obj)).toMatchInlineSnapshot(`"{"v":"****"}"`);
});

it("should work in zod schemas", () => {
  const schema = z4.object({
    v: z4.string().transform(CensoredString.transform),
  });
  const result = schema.parse({ v: "0123456789abcdefghij" });
  expect(result).toMatchInlineSnapshot(`
    {
      "v": "********ghij",
    }
  `);
  expect(result.v.value).toBe("0123456789abcdefghij");
});
