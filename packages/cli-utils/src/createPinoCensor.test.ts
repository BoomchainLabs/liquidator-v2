import { expect, it } from "vitest";
import { CensoredString } from "./CensoredString.js";
import { CensoredURL } from "./CensoredURL.js";
import { createPinoCensor } from "./createPinoCensor.js";

it("returns an identity function when there are no secrets", () => {
  const line = 'level=30 msg="api key abc123 is fine"';
  expect(createPinoCensor({})(line)).toBe(line);
  expect(createPinoCensor({ x: "plain", y: 5, z: null })(line)).toBe(line);
});

it("censors every nested secret while ignoring short and non-string nodes", () => {
  const a = new CensoredString("longsecretvalue1");
  const url = new CensoredURL("https://rpc.example.com/key/longsecretvalue2");
  const b = new CensoredString("anothersecretvalue");
  const short = new CensoredString("abc");

  const censor = createPinoCensor({
    a: { b: [a] },
    c: url,
    d: [b, short],
    e: null,
    f: undefined,
    g: 42,
    h: true,
  });

  const line =
    "one=longsecretvalue1 two=https://rpc.example.com/key/longsecretvalue2 three=anothersecretvalue again=longsecretvalue1 short=abc";
  const result = censor(line);

  expect(result).toBe(
    `one=********ue1 two=https://rpc.example.com/****** three=********lue again=********ue1 short=abc`,
  );
});

it("prefers the longest secret when one is a substring of another", () => {
  const long = new CensoredString("abcd1234ef");
  const shortish = new CensoredString("abcd");

  const censor = createPinoCensor({ long, shortish });
  const result = censor("token=abcd1234ef and key=abcd");
  expect(result).toBe(`token=********ef and key=****`);
});

it("treats regex metacharacters in secrets literally", () => {
  const a = new CensoredString("secret[key]value");
  const b = new CensoredString("a.c*?+def");

  const censor = createPinoCensor({ a, b });
  const result = censor("x=secret[key]value y=a.c*?+def keep=axcdef");

  expect(result).toBe(`x=********lue y=********f keep=axcdef`);
});
