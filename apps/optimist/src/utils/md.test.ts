import { md } from "@vlad-yakovlev/telegram-md";
import { expect, it } from "vitest";

import { mdList } from "./md";

it("should escape lists", () => {
  const actual = md.build(
    mdList([md`Hello ${md.bold("sun")}`, md`Hello ${md.bold("moon")}`]),
  );
  expect(actual).toEqual(`• Hello *sun*
• Hello *moon*`);
});
