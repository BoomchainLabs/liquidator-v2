import { expect, it } from "vitest";

import { CensoredURL } from "./CensoredURL.js";

it.each([
  {
    url: "https://example.com/?secret=123",
    expected: "https://example.com/******",
  },
  {
    url: "https://example.com/qwertyu",
    expected: "https://example.com/******",
  },
  {
    description: "should not censor URLs containing 127.0.0.1",
    url: "http://127.0.0.1/?secret=123",
    expected: "http://127.0.0.1/?secret=123",
  },
  {
    url: "http://localhost/?secret=123",
    expected: "http://localhost/?secret=123",
  },
  {
    url: "http://host.docker.internal/?secret=123",
    expected: "http://host.docker.internal/?secret=123",
  },
  {
    url: "some string",
    expected: "********ng",
  },
  {
    description: "should censor username and password in URL",
    url: "http://admin:secret123@example.com/api?key=value",
    expected: "http://****:****@example.com/******",
  },
])("should censor url", ({ url, expected }) => {
  const censoredURL = new CensoredURL(url);
  expect(censoredURL.value).toBe(url);
  expect(censoredURL.toString()).toBe(expected);
});
